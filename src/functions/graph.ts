import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { GoogleGenAI } from "@google/genai";

export type GraphNode = {
  id: string;
  label: string;
  kind: string;
  val: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  label: string;
};

export type KnowledgeGraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export const getKnowledgeGraphFn = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    if (!userId) throw new Error("Unauthorized");

    const { data: documents, error } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "ready");

    if (error) throw new Error(error.message);

    const nodeMap = new Map<string, GraphNode>();
    const edgeMap = new Map<string, GraphEdge>();

    const addNode = (id: string, label: string, kind: string, val = 1) => {
      if (!nodeMap.has(id)) {
        nodeMap.set(id, { id, label, kind, val });
      } else {
        const existing = nodeMap.get(id)!;
        existing.val += val; // Increase size based on connections
      }
      return id;
    };

    const addEdge = (source: string, target: string, label: string) => {
      const id = `${source}->${target}`;
      if (!edgeMap.has(id) && source !== target) {
        edgeMap.set(id, { source, target, label });
      }
    };

    documents.forEach((doc) => {
      const docId = `doc:${doc.id}`;
      addNode(docId, doc.name, "doc", 2);

      const entities = (doc.entities as any) || {};

      if (doc.department) {
        const deptId = `dept:${slugify(doc.department)}`;
        addNode(deptId, doc.department, "department");
        addEdge(docId, deptId, "BELONGS_TO");
      }

      if (doc.engineer_name) {
        const engId = `person:${slugify(doc.engineer_name)}`;
        addNode(engId, doc.engineer_name, "person");
        addEdge(docId, engId, "CREATED_BY");
      }

      if (doc.equipment_tag) {
        const tagId = `asset:${slugify(doc.equipment_tag)}`;
        addNode(tagId, doc.equipment_tag, "asset");
        addEdge(docId, tagId, "REFERENCES");
      }

      // Arrays from entities
      const processArray = (arr: string[] | undefined, prefix: string, kind: string, relLabel: string) => {
        if (!Array.isArray(arr)) return;
        arr.forEach((item) => {
          if (!item.trim()) return;
          const nid = `${prefix}:${slugify(item)}`;
          addNode(nid, item, kind);
          addEdge(docId, nid, relLabel);
        });
      };

      processArray(entities.equipmentIds, "asset", "asset", "RELATED_TO");
      processArray(entities.valveIds, "asset", "asset", "RELATED_TO");
      processArray(entities.pumpIds, "asset", "asset", "RELATED_TO");
      processArray(entities.boilerIds, "asset", "asset", "RELATED_TO");
      processArray(entities.engineers, "person", "person", "MENTIONS");
      processArray(entities.complianceStandards, "compliance", "compliance", "COMPLIES_WITH");
      processArray(entities.safetyProcedures, "doc", "doc", "REQUIRES_SOP");
      processArray(doc.detected_equipment || [], "asset", "asset", "DETECTED");
      processArray(doc.regulatory_refs || [], "compliance", "compliance", "REFERENCES_REGULATION");
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.values()),
    };
  });

export const getNodeDetailsFn = createServerFn({ method: "POST" })
  .validator((data: { nodeId: string; nodeLabel: string; nodeKind: string; userId: string }) => data)
  .handler(async ({ data: { nodeId, nodeLabel, nodeKind, userId } }) => {
    if (!userId) throw new Error("Unauthorized");

    // Get related documents to this node
    let relatedDocs = [];
    let summary = "";
    
    // If it's a document node, we can fetch it directly
    if (nodeKind === "doc" && nodeId.startsWith("doc:")) {
      const docId = nodeId.replace("doc:", "");
      const { data: doc } = await supabaseAdmin
        .from("documents")
        .select("ai_summary, name, status, created_at, department, equipment_tag")
        .eq("id", docId)
        .eq("user_id", userId)
        .single();
        
      if (doc) {
        summary = doc.ai_summary || "Document processed successfully.";
        relatedDocs.push({ id: docId, name: doc.name });
      }
    } else {
      // Find documents where this entity appears
      const { data: allDocs } = await supabaseAdmin
        .from("documents")
        .select("id, name, full_text, entities")
        .eq("user_id", userId)
        .eq("status", "ready");

      if (allDocs) {
        const docsContainingEntity = allDocs.filter(d => {
          const text = (d.full_text || "").toLowerCase();
          const label = nodeLabel.toLowerCase();
          return text.includes(label);
        });

        relatedDocs = docsContainingEntity.map(d => ({ id: d.id, name: d.name })).slice(0, 10);

        if (docsContainingEntity.length > 0) {
          // Generate an AI summary based on these documents
          try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey) {
              const ai = new GoogleGenAI({ apiKey });
              const context = docsContainingEntity.slice(0, 3).map(d => `Document "${d.name}":\n${d.full_text?.substring(0, 1500)}`).join("\n\n");
              
              const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                  `You are an industrial data analyst. Summarize all known information about "${nodeLabel}" (Type: ${nodeKind}) based ONLY on the following context. Keep it under 150 words. Do not invent information. If there is no specific maintenance or failure history, just state what it is.`,
                  context
                ]
              });
              summary = response.text || "No insights could be generated.";
            } else {
              summary = "AI summarization unavailable (missing API key).";
            }
          } catch (e) {
            console.error("AI Gen Error:", e);
            summary = "Error generating AI summary.";
          }
        } else {
          summary = "No detailed information found in uploaded documents.";
        }
      }
    }

    return {
      summary,
      relatedDocs,
    };
  });
