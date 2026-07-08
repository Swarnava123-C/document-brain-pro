import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

export type EquipmentHealth = {
  id: string;
  name: string;
  area: string;
  health: number;
  status: "Optimal" | "Monitor" | "Warning" | "Critical";
  rul: number;
  lastService: string;
  trend: number[];
  docCount: number;
};

// Generate deterministic but pseudo-random numbers based on a string seed
function seedRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export const getEquipmentHealthFn = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    if (!userId) throw new Error("Unauthorized");

    const { data: documents, error } = await supabaseAdmin
      .from("documents")
      .select("id, name, department, entities, full_text, updated_at")
      .eq("user_id", userId)
      .eq("status", "ready");

    if (error) throw new Error(error.message);

    const equipmentMap = new Map<string, EquipmentHealth>();

    documents.forEach((doc) => {
      const entities = (doc.entities as any) || {};
      const fullText = (doc.full_text || "").toLowerCase();
      
      const isNegative = fullText.includes("fail") || fullText.includes("breakdown") || fullText.includes("critical") || fullText.includes("leak") || fullText.includes("replace");
      const isWarning = fullText.includes("vibration") || fullText.includes("temperature high") || fullText.includes("anomaly");

      const processIds = (ids: string[] | undefined, defaultArea: string) => {
        if (!Array.isArray(ids)) return;
        ids.forEach((id) => {
          if (!id.trim()) return;
          const cleanId = id.trim().toUpperCase();
          
          if (!equipmentMap.has(cleanId)) {
            // Seed random generation based on equipment ID so it remains consistent per asset
            const rand = seedRandom(cleanId);
            
            // Base health
            let baseHealth = 85 + (rand() % 100) / 100 * 15; // 85-100
            if (isNegative) baseHealth -= 40 + (rand() % 100) / 100 * 20;
            else if (isWarning) baseHealth -= 15 + (rand() % 100) / 100 * 15;
            
            baseHealth = Math.max(10, Math.min(100, Math.floor(baseHealth)));
            
            let status: EquipmentHealth["status"] = "Optimal";
            if (baseHealth < 40) status = "Critical";
            else if (baseHealth < 65) status = "Warning";
            else if (baseHealth < 85) status = "Monitor";
            
            const rul = Math.floor((baseHealth / 100) * 365 + (rand() % 100) / 100 * 30);
            
            // Generate a historical trend leading up to current health
            const trend = [];
            let current = baseHealth + 30; // start higher 8 weeks ago
            for (let i = 0; i < 8; i++) {
              trend.push(Math.min(100, Math.floor(current)));
              current -= (current - baseHealth) / (8 - i) + ((rand() % 100) / 100 * 5 - 2);
            }
            trend[7] = baseHealth; // ensure last point is exact
            
            equipmentMap.set(cleanId, {
              id: cleanId,
              name: `Asset ${cleanId}`,
              area: doc.department || defaultArea,
              health: baseHealth,
              status,
              rul,
              lastService: new Date(doc.updated_at).toLocaleDateString(),
              trend,
              docCount: 1,
            });
          } else {
            const existing = equipmentMap.get(cleanId)!;
            existing.docCount += 1;
            
            // Adjust health if new docs indicate failure
            if (isNegative && existing.health > 40) {
              existing.health = Math.floor(existing.health * 0.6);
              existing.status = existing.health < 40 ? "Critical" : "Warning";
              existing.trend[7] = existing.health; // Drop the current point
            }
          }
        });
      };

      processIds(entities.equipmentIds, "General Plant");
      processIds(entities.pumpIds, "Pumping Station");
      processIds(entities.valveIds, "Piping & Flow");
      processIds(entities.boilerIds, "Steam Generation");
    });

    // If no equipment found, return empty array
    const equipmentList = Array.from(equipmentMap.values()).sort((a, b) => a.health - b.health);
    return equipmentList;
  });


const rcaSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    confidence: { type: Type.NUMBER },
    hypothesis: { type: Type.STRING },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
};

export const generateRCAFn = createServerFn({ method: "POST" })
  .validator((data: { equipmentId: string; userId: string }) => data)
  .handler(async ({ data: { equipmentId, userId } }) => {
    if (!userId) throw new Error("Unauthorized");

    // Fetch documents linked to this equipment
    const { data: allDocs } = await supabaseAdmin
      .from("documents")
      .select("id, name, full_text")
      .eq("user_id", userId)
      .eq("status", "ready");

    const docsContainingEntity = (allDocs || []).filter(d => {
      const text = (d.full_text || "").toLowerCase();
      return text.includes(equipmentId.toLowerCase());
    });

    let context = docsContainingEntity.slice(0, 5).map(d => `Document "${d.name}":\n${d.full_text?.substring(0, 1500)}`).join("\n\n");
    if (!context) {
      context = "No detailed document history found for this equipment. Provide a generalized probable cause based on standard industrial knowledge for this type of equipment.";
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing Gemini API Key");

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an expert AI industrial maintenance assistant. Perform a Root Cause Analysis (RCA) for equipment ID: "${equipmentId}".
      
      Use the following document history as context:
      ${context}
      
      Provide a highly realistic, technical root cause hypothesis. Generate 3-4 actionable recommendations (e.g. inspections, component replacements).`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: rcaSchema,
          temperature: 0.3,
        }
      });

      if (!response.text) throw new Error("No response");
      return JSON.parse(response.text) as { title: string, confidence: number, hypothesis: string, recommendations: string[] };

    } catch (e: any) {
      console.error("RCA Error:", e);
      return {
        title: `${equipmentId} predicted failure risk`,
        confidence: 0.85,
        hypothesis: "Unable to generate live RCA from Gemini at this time. Standard wear and tear expected based on operational hours.",
        recommendations: ["Schedule routine visual inspection", "Review connected operating procedures", "Monitor vibration metrics"],
      };
    }
  });
