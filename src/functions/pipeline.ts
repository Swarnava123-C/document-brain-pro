import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { chunkText } from "@/services/chunker";
import { embedBatch } from "@/services/embedding";

// ────────────────────────────────────────────────────────────────
// Gemini extraction schema (includes full_text for RAG)
// ────────────────────────────────────────────────────────────────
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    department:        { type: Type.STRING },
    equipment_tag:     { type: Type.STRING },
    engineer_name:     { type: Type.STRING },
    confidence: {
      type: Type.NUMBER,
      description: "Float 0–1 indicating extraction confidence",
    },
    ai_summary:        { type: Type.STRING },
    full_text: {
      type: Type.STRING,
      description:
        "The complete, cleaned textual content of the document. Preserve paragraph structure. Used for semantic chunking and RAG retrieval.",
    },
    keywords:           { type: Type.ARRAY, items: { type: Type.STRING } },
    detected_equipment: { type: Type.ARRAY, items: { type: Type.STRING } },
    related_assets:     { type: Type.ARRAY, items: { type: Type.STRING } },
    regulatory_refs:    { type: Type.ARRAY, items: { type: Type.STRING } },
    entities: {
      type: Type.OBJECT,
      properties: {
        equipmentIds:        { type: Type.ARRAY, items: { type: Type.STRING } },
        valveIds:            { type: Type.ARRAY, items: { type: Type.STRING } },
        pumpIds:             { type: Type.ARRAY, items: { type: Type.STRING } },
        boilerIds:           { type: Type.ARRAY, items: { type: Type.STRING } },
        maintenanceDates:    { type: Type.ARRAY, items: { type: Type.STRING } },
        engineers:           { type: Type.ARRAY, items: { type: Type.STRING } },
        safetyProcedures:    { type: Type.ARRAY, items: { type: Type.STRING } },
        complianceStandards: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
  },
};

// ────────────────────────────────────────────────────────────────
// Main server function
// ────────────────────────────────────────────────────────────────
export const processDocumentFn = createServerFn({ method: "POST" })
  .validator(
    (data: { docId: string; storagePath: string; filename: string }) => data
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { docId, storagePath, filename } = data;

    try {
      console.log(`[pipeline] Starting: ${docId} — ${filename}`);

      // Stage 1 — Upload registered
      await supabaseAdmin
        .from("documents")
        .update({ current_stage: 1, status: "processing" })
        .eq("id", docId);

      // Stage 2 — Download file from storage
      const { data: fileData, error: dlErr } = await supabaseAdmin.storage
        .from("documents")
        .download(storagePath);
      if (dlErr || !fileData)
        throw new Error(`Download failed: ${dlErr?.message}`);

      const arrayBuffer = await fileData.arrayBuffer();
      const base64Data  = Buffer.from(arrayBuffer).toString("base64");
      const mimeType    = fileData.type || "application/octet-stream";

      // Stage 3 — OCR / text extraction started
      await supabaseAdmin
        .from("documents")
        .update({ current_stage: 3, status: "processing" })
        .eq("id", docId);

      // ── Gemini: extraction ──────────────────────────────────────
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY not set");

      const ai = new GoogleGenAI({ apiKey });
      const prompt =
        `You are an expert industrial document analyzer for IndustrialMind AI. ` +
        `Extract ALL metadata, equipment IDs, entities, and the FULL TEXT of this document. ` +
        `Document filename: ${filename}. ` +
        `For full_text, reproduce the complete, cleaned textual content preserving paragraphs. ` +
        `Follow the JSON schema strictly. Use empty arrays for missing fields.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [prompt, { inlineData: { data: base64Data, mimeType } }],
        config: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.2,
        },
      });

      if (!response.text) throw new Error("No response from Gemini");

      // Stage 5 — Entity extraction complete
      await supabaseAdmin
        .from("documents")
        .update({ current_stage: 5, status: "processing" })
        .eq("id", docId);

      const result = JSON.parse(response.text);
      const fullText: string = result.full_text || result.ai_summary || "";

      // Stage 6 — Chunking + embedding
      await supabaseAdmin
        .from("documents")
        .update({ current_stage: 6, status: "processing" })
        .eq("id", docId);

      // ── Chunk the extracted text ──────────────────────────────
      const chunks = chunkText(fullText, 1000, 150);
      console.log(`[pipeline] ${chunks.length} chunks generated for ${docId}`);

      // ── Generate embeddings in batches ────────────────────────
      if (chunks.length > 0) {
        const chunkTexts  = chunks.map((c) => c.content);
        const embeddings  = await embedBatch(chunkTexts, 250); // 250ms between calls

        const entities = result.entities ?? {};

        const chunkRows = chunks.map((chunk, i) => ({
          document_id: docId,
          chunk_index: chunk.chunkIndex,
          content:     chunk.content,
          metadata: {
            document_name:   filename,
            department:      result.department   ?? null,
            equipment_tag:   result.equipment_tag ?? null,
            equipmentIds:    entities.equipmentIds    ?? [],
            valveIds:        entities.valveIds         ?? [],
            pumpIds:         entities.pumpIds          ?? [],
            boilerIds:       entities.boilerIds        ?? [],
            complianceStandards: entities.complianceStandards ?? [],
            regulatory_refs: result.regulatory_refs ?? [],
          },
          embedding: embeddings[i],
        }));

        // Stage 7 — Storing vectors
        await supabaseAdmin
          .from("documents")
          .update({ current_stage: 7, status: "processing" })
          .eq("id", docId);

        // Delete any previous chunks (e.g. if reprocessed)
        await supabaseAdmin
          .from("document_chunks")
          .delete()
          .eq("document_id", docId);

        // Bulk insert (batched in 50s to avoid payload limits)
        const BATCH = 50;
        for (let i = 0; i < chunkRows.length; i += BATCH) {
          const batch = chunkRows.slice(i, i + BATCH);
          const { error: insertErr } = await supabaseAdmin
            .from("document_chunks")
            .insert(batch as any);
          if (insertErr)
            console.error(`[pipeline] chunk insert error:`, insertErr.message);
        }
      }

      // Stage 8 — Finalise document metadata
      await supabaseAdmin
        .from("documents")
        .update({
          current_stage:      8,
          status:             "ready",
          full_text:          fullText,
          department:         result.department,
          equipment_tag:      result.equipment_tag,
          engineer_name:      result.engineer_name,
          confidence:         result.confidence ?? 0.85,
          ai_summary:         result.ai_summary,
          keywords:           result.keywords           ?? [],
          detected_equipment: result.detected_equipment ?? [],
          related_assets:     result.related_assets     ?? [],
          regulatory_refs:    result.regulatory_refs    ?? [],
          entities:           result.entities           ?? {},
        })
        .eq("id", docId);

      console.log(`[pipeline] Completed: ${docId}`);
      return { success: true, chunks: chunks.length };
    } catch (err: any) {
      console.error(`[pipeline] Error (${docId}):`, err);
      await supabaseAdmin
        .from("documents")
        .update({ status: "failed" })
        .eq("id", docId);
      return { success: false, error: err.message };
    }
  });
