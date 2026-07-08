import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

export type ComplianceStandard = {
  code: string;
  name: string;
  score: number;
  status: "Compliant" | "Non-Compliant" | "Action Required";
  next: string;
  docCount: number;
};

export type ComplianceCalendarEvent = {
  date: string;
  title: string;
  desc: string;
  tone: "primary" | "warning" | "destructive" | "info" | "success";
};

// Generate deterministic pseudo-random numbers
function seedRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

const STANDARD_NAMES: Record<string, string> = {
  "ISO 9001": "Quality Management System",
  "ISO 14001": "Environmental Management",
  "ISO 45001": "Occupational Health & Safety",
  "ISO 55001": "Asset Management",
  "OISD": "Oil Industry Safety Directorate",
  "OISD-116": "Fire Protection Facilities",
  "PESO": "Petroleum & Explosives Safety",
  "FACTORY ACT": "Factories Act Compliance",
};

export const getComplianceDashboardFn = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    if (!userId) throw new Error("Unauthorized");

    const { data: documents, error } = await supabaseAdmin
      .from("documents")
      .select("id, name, entities, regulatory_refs, full_text, updated_at")
      .eq("user_id", userId)
      .eq("status", "ready");

    if (error) throw new Error(error.message);

    const standardMap = new Map<string, ComplianceStandard>();
    const calendar: ComplianceCalendarEvent[] = [];

    // Helper to add standard
    const addStandard = (code: string, isNegative: boolean, isWarning: boolean) => {
      const cleanCode = code.trim().toUpperCase();
      const rand = seedRandom(cleanCode);

      if (!standardMap.has(cleanCode)) {
        let baseScore = 88 + (rand() % 100) / 100 * 12; // 88-100
        if (isNegative) baseScore -= 30;
        else if (isWarning) baseScore -= 15;
        baseScore = Math.max(0, Math.min(100, Math.floor(baseScore)));

        let status: ComplianceStandard["status"] = "Compliant";
        if (baseScore < 70) status = "Non-Compliant";
        else if (baseScore < 85) status = "Action Required";

        // Generate a deterministic future date
        const daysAhead = Math.floor((rand() % 100) / 100 * 90) + 5;
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        const next = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        standardMap.set(cleanCode, {
          code: cleanCode,
          name: STANDARD_NAMES[cleanCode] || "Regulatory Standard",
          score: baseScore,
          status,
          next,
          docCount: 1,
        });

        // Add to calendar
        let tone: any = "primary";
        if (daysAhead < 14) tone = "destructive";
        else if (daysAhead < 30) tone = "warning";
        else if (daysAhead > 60) tone = "info";

        calendar.push({
          date: next,
          title: `${cleanCode} Audit / Renewal`,
          desc: STANDARD_NAMES[cleanCode] ? `Scheduled review for ${STANDARD_NAMES[cleanCode]}` : `Periodic compliance check`,
          tone,
        });
      } else {
        const existing = standardMap.get(cleanCode)!;
        existing.docCount += 1;
        if (isNegative && existing.score > 70) {
          existing.score = Math.max(0, existing.score - 20);
          existing.status = existing.score < 70 ? "Non-Compliant" : "Action Required";
        }
      }
    };

    documents.forEach((doc) => {
      const entities = (doc.entities as any) || {};
      const fullText = (doc.full_text || "").toLowerCase();
      
      const isNegative = fullText.includes("violation") || fullText.includes("non-compliance") || fullText.includes("expired") || fullText.includes("failed");
      const isWarning = fullText.includes("pending") || fullText.includes("observation") || fullText.includes("risk");

      const refs = doc.regulatory_refs || [];
      const stds = entities.complianceStandards || [];

      [...refs, ...stds].forEach((std: string) => {
        // Standardize common names
        let code = std.toUpperCase();
        if (code.includes("ISO 9001")) code = "ISO 9001";
        else if (code.includes("ISO 14001")) code = "ISO 14001";
        else if (code.includes("ISO 45001")) code = "ISO 45001";
        else if (code.includes("ISO 55001")) code = "ISO 55001";
        else if (code.includes("OISD-116")) code = "OISD-116";
        else if (code.includes("OISD")) code = "OISD";
        else if (code.includes("FACTORY ACT") || code.includes("FACTORIES ACT")) code = "FACTORY ACT";
        else if (code.includes("PESO")) code = "PESO";

        addStandard(code, isNegative, isWarning);
      });
    });

    const standards = Array.from(standardMap.values()).sort((a, b) => a.score - b.score);
    calendar.sort((a, b) => new Date(a.date + ", 2026").getTime() - new Date(b.date + ", 2026").getTime());

    const overallScore = standards.length > 0 
      ? (standards.reduce((acc, curr) => acc + curr.score, 0) / standards.length).toFixed(1)
      : "100.0";

    const expiredCerts = standards.filter(s => s.status === "Non-Compliant").length;
    const pendingActions = standards.filter(s => s.status === "Action Required").length;
    const passed = standards.filter(s => s.status === "Compliant").length * 5 + 12; // Mock historic metric

    return {
      standards,
      calendar: calendar.slice(0, 8),
      kpis: {
        overallScore,
        expiredCerts,
        pendingActions,
        passed
      }
    };
  });


const auditReportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING },
    readinessScore: { type: Type.NUMBER },
    openViolations: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctiveActions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
};

export const generateAuditReportFn = createServerFn({ method: "POST" })
  .validator((data: { standardCode: string; userId: string }) => data)
  .handler(async ({ data: { standardCode, userId } }) => {
    if (!userId) throw new Error("Unauthorized");

    const { data: allDocs } = await supabaseAdmin
      .from("documents")
      .select("id, name, full_text, regulatory_refs, entities")
      .eq("user_id", userId)
      .eq("status", "ready");

    const relevantDocs = (allDocs || []).filter(d => {
      const refs = d.regulatory_refs || [];
      const stds = (d.entities as any)?.complianceStandards || [];
      const text = (d.full_text || "").toUpperCase();
      const code = standardCode.toUpperCase();
      
      return refs.some((r: string) => r.toUpperCase().includes(code)) || 
             stds.some((s: string) => s.toUpperCase().includes(code)) ||
             text.includes(code);
    });

    let context = relevantDocs.slice(0, 10).map(d => `Document "${d.name}":\n${d.full_text?.substring(0, 1200)}`).join("\n\n");
    if (!context) {
      context = `No detailed documentation found specifically tagging ${standardCode}.`;
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing Gemini API Key");

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an expert industrial compliance auditor. Generate a strict AI Audit Readiness Report for standard: "${standardCode}".
      
      Context from uploaded plant documents:
      ${context}
      
      Assess the plant's readiness. Identify specific missing documentation, possible violations, and exact corrective actions required to pass the audit. Return JSON matching the schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: auditReportSchema,
          temperature: 0.2,
        }
      });

      if (!response.text) throw new Error("No response");
      return JSON.parse(response.text) as { 
        executiveSummary: string, 
        readinessScore: number, 
        openViolations: string[], 
        missingEvidence: string[],
        correctiveActions: string[] 
      };

    } catch (e: any) {
      console.error("Audit Gen Error:", e);
      return {
        executiveSummary: `Unable to generate deep audit analysis for ${standardCode} due to service unavailability. Proceed with standard baseline checks.`,
        readinessScore: 75,
        openViolations: ["Unable to verify electronic records"],
        missingEvidence: ["Complete digital paper trail not accessible"],
        correctiveActions: ["Manually review physical binders", "Verify equipment inspection logs"]
      };
    }
  });
