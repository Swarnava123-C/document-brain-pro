import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { GoogleGenAI } from "@google/genai";
import { retrieveContext } from "@/functions/search";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const APIRoute = createAPIFileRoute("/api/chat")({
  POST: async ({ request }) => {
    try {
      const { message, conversationId, userId } = await request.json();

      if (!message || !conversationId || !userId) {
        return new Response("Missing parameters", { status: 400 });
      }

      // Verify the conversation belongs to the user
      const { data: conv, error: convErr } = await supabaseAdmin
        .from("copilot_conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", userId)
        .single();

      if (convErr || !conv) {
        return new Response("Unauthorized or conversation not found", { status: 401 });
      }

      // Retrieve recent conversation history for context (last 5 messages)
      const { data: history } = await supabaseAdmin
        .from("copilot_messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(5);

      const pastMessages = (history || []).reverse().map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Retrieve context from PGVector
      const chunks = await retrieveContext({ query: message, topK: 8, threshold: 0.4 });
      
      const citations = chunks.map((c) => ({
        id: c.id,
        name: c.metadata.document_name || "Unknown Document",
        contentSnippet: c.content.substring(0, 100) + "...",
        similarity: c.similarity,
        equipmentIds: c.metadata.equipmentIds || [],
      }));

      const contextText = chunks
        .map((c, i) => `--- SOURCE ${i + 1} (${c.metadata.document_name}) ---\n${c.content}\n`)
        .join("\n");

      // Save user message to DB
      await supabaseAdmin.from("copilot_messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: message,
      });

      // Construct Gemini prompt
      const systemPrompt = `You are IndustrialMind AI, an expert industrial AI Copilot.
You answer technical and operational questions using ONLY the provided sources. 
When answering, refer to the sources naturally. Use markdown for formatting (tables, lists, bold text).
If the sources do not contain the answer, say "I don't have enough information in the uploaded documents to answer that." DO NOT invent or guess information.

PROVIDED SOURCES:
${contextText}`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-2.5-pro",
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          ...pastMessages,
          { role: "user", parts: [{ text: message }] },
        ],
      });

      // We will stream the response back to the client using a ReadableStream
      // and simultaneously accumulate the response to save it to Supabase.
      
      const encoder = new TextEncoder();
      let fullResponse = "";

      const stream = new ReadableStream({
        async start(controller) {
          // Send citations first as a special JSON line
          const citationsData = JSON.stringify({ type: "citations", data: citations });
          controller.enqueue(encoder.encode(citationsData + "\n\n"));

          try {
            for await (const chunk of responseStream) {
              const text = chunk.text;
              if (text) {
                fullResponse += text;
                const chunkData = JSON.stringify({ type: "text", data: text });
                controller.enqueue(encoder.encode(chunkData + "\n\n"));
              }
            }
          } catch (err) {
            console.error("Gemini stream error:", err);
            controller.enqueue(encoder.encode(JSON.stringify({ type: "error", data: "Stream interrupted" }) + "\n\n"));
          } finally {
            // Save the assistant message to the DB when stream ends
            await supabaseAdmin.from("copilot_messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: fullResponse,
              citations: citations as any,
            });
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } catch (error: any) {
      console.error("/api/chat Error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  },
});
