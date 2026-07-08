// Document Intelligence Pipeline — realistic industrial simulation.
export const PIPELINE_STAGES = [
  { key: "uploaded", label: "File Uploaded", desc: "Ingested into secure storage", ms: 400 },
  { key: "ocr", label: "OCR Extraction", desc: "Reading scanned pages & drawings", ms: 1400 },
  { key: "text", label: "Text Extraction", desc: "Layout-aware text parsing", ms: 900 },
  { key: "entities", label: "Entity Extraction", desc: "Equipment, valves, engineers", ms: 1500 },
  { key: "metadata", label: "Metadata Detection", desc: "Doc type, department, dates", ms: 700 },
  { key: "embeddings", label: "Embedding Generation", desc: "Vectorising for semantic search", ms: 1600 },
  { key: "graph", label: "Knowledge Graph Linking", desc: "Linking to assets & incidents", ms: 1200 },
  { key: "index", label: "AI Indexing", desc: "Semantic index + reranker training", ms: 1100 },
  { key: "ready", label: "Ready for Search", desc: "Available across the platform", ms: 300 },
] as const;

export type PipelineStageKey = (typeof PIPELINE_STAGES)[number]["key"];

const ENGINEERS = [
  "R. Iyer", "S. Malhotra", "A. Karim", "L. Chen", "M. Patel",
  "J. Okafor", "K. Reyes", "N. Fernandes", "T. Nakamura",
];
const DEPTS = ["Process", "Operations", "Reliability", "HSE", "Maintenance", "Compliance"];
const EQUIP_PREFIX = ["P", "C", "B", "V", "HX", "M", "T", "FAN"] as const;
const STANDARDS = ["ISO 55001", "ISO 14001", "ISO 45001", "OISD-116", "PESO", "Factory Act 1948", "API RP 580"];
const PROCEDURES = [
  "SOP-COLD-START-01", "SOP-HOT-SHUT-03", "LOTO-Procedure-A2",
  "Confined-Space-Entry", "HAZOP-Rev-9", "Emergency-Depressurisation",
];
const KEYWORDS_POOL = [
  "vibration", "seal leak", "tube fouling", "overhaul", "alignment",
  "corrosion", "instrument loop", "safety valve", "startup", "shutdown",
  "preventive", "predictive", "root cause", "casing", "bearing", "impeller",
];
const ASSETS = ["Unit 3 CDU", "Tank Farm South", "Utilities Block", "Reactor Loop A", "HRSG-1", "Rolling Mill 2"];

function seeded(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; return (h >>> 0) / 4294967295; };
}
function pick<T>(rng: () => number, arr: readonly T[]) { return arr[Math.floor(rng() * arr.length)]; }
function pickMany<T>(rng: () => number, arr: readonly T[], min: number, max: number) {
  const n = min + Math.floor(rng() * (max - min + 1));
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}
function id(rng: () => number, prefix: string) { return `${prefix}-${100 + Math.floor(rng() * 899)}`; }

export function guessDocType(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "PDF";
  if (n.match(/\.(docx?|odt)$/)) return "Word";
  if (n.match(/\.(xlsx?|csv)$/)) return "Spreadsheet";
  if (n.match(/\.(png|jpe?g|gif|webp|tiff?)$/)) return "Image";
  if (n.match(/\.(dwg|dxf|step|iges)$/)) return "Engineering Drawing";
  if (n.match(/\.(ppt|pptx|key)$/)) return "Presentation";
  if (n.match(/\.(eml|msg)$/)) return "Email";
  if (n.endsWith(".zip") || n.endsWith(".rar")) return "Archive";
  return "Document";
}

export type IntelligenceProfile = {
  doc_type: string;
  department: string;
  equipment_tag: string;
  engineer_name: string;
  confidence: number;
  ai_summary: string;
  keywords: string[];
  detected_equipment: string[];
  related_assets: string[];
  regulatory_refs: string[];
  entities: {
    equipmentIds: string[];
    valveIds: string[];
    pumpIds: string[];
    boilerIds: string[];
    maintenanceDates: string[];
    engineers: string[];
    safetyProcedures: string[];
    complianceStandards: string[];
  };
};

export function generateProfile(filename: string): IntelligenceProfile {
  const rng = seeded(filename + Date.now().toString(36));
  const doc_type = guessDocType(filename);
  const equipment_tag = `${pick(rng, EQUIP_PREFIX)}-${100 + Math.floor(rng() * 899)}`;
  const engineer_name = pick(rng, ENGINEERS);
  const department = pick(rng, DEPTS);
  const pumpIds = Array.from({ length: 1 + Math.floor(rng() * 2) }, () => id(rng, "P"));
  const valveIds = Array.from({ length: 1 + Math.floor(rng() * 3) }, () => id(rng, "V"));
  const boilerIds = rng() > 0.5 ? [id(rng, "B")] : [];
  const equipmentIds = [equipment_tag, id(rng, "HX"), id(rng, "C")];
  const engineers = pickMany(rng, ENGINEERS, 1, 3);
  const safetyProcedures = pickMany(rng, PROCEDURES, 1, 3);
  const complianceStandards = pickMany(rng, STANDARDS, 1, 3);
  const maintenanceDates = Array.from({ length: 2 + Math.floor(rng() * 2) }, () => {
    const d = new Date(2026, Math.floor(rng() * 9), 1 + Math.floor(rng() * 27));
    return d.toISOString().slice(0, 10);
  });
  const keywords = pickMany(rng, KEYWORDS_POOL, 4, 7);
  const related_assets = pickMany(rng, ASSETS, 1, 3);
  const confidence = 0.86 + rng() * 0.13;
  const short = filename.replace(/\.[^.]+$/, "");
  const ai_summary = `${doc_type} covering ${short}. Discusses ${equipment_tag} in the ${department} area, with references to ${complianceStandards[0]}. Highlights ${keywords.slice(0, 3).join(", ")} and links to ${related_assets[0]}. Recommended actions logged against engineer ${engineer_name}.`;

  return {
    doc_type,
    department,
    equipment_tag,
    engineer_name,
    confidence: Number(confidence.toFixed(3)),
    ai_summary,
    keywords,
    detected_equipment: equipmentIds,
    related_assets,
    regulatory_refs: complianceStandards,
    entities: {
      equipmentIds,
      valveIds,
      pumpIds,
      boilerIds,
      maintenanceDates,
      engineers,
      safetyProcedures,
      complianceStandards,
    },
  };
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}
