// Realistic industrial mock data for IndustrialMind AI
export const stats = [
  { label: "Total Documents", value: "48,392", delta: "+12.4%", trend: "up" as const, icon: "FileText" },
  { label: "Tracked Assets", value: "2,847", delta: "+3.1%", trend: "up" as const, icon: "Boxes" },
  { label: "Active Equipment", value: "1,204", delta: "+0.8%", trend: "up" as const, icon: "Cog" },
  { label: "Active Users", value: "312", delta: "+18", trend: "up" as const, icon: "Users" },
  { label: "Pending Maintenance", value: "47", delta: "-6", trend: "down" as const, icon: "Wrench" },
  { label: "Compliance Score", value: "94.6%", delta: "+1.2%", trend: "up" as const, icon: "ShieldCheck" },
  { label: "AI Queries Today", value: "8,721", delta: "+22.3%", trend: "up" as const, icon: "Sparkles" },
  { label: "Knowledge Links", value: "126,483", delta: "+4.6%", trend: "up" as const, icon: "Network" },
];

export const documentGrowth = [
  { month: "Jan", documents: 32100, indexed: 30800 },
  { month: "Feb", documents: 34200, indexed: 33100 },
  { month: "Mar", documents: 36850, indexed: 35400 },
  { month: "Apr", documents: 39100, indexed: 38200 },
  { month: "May", documents: 41750, indexed: 40900 },
  { month: "Jun", documents: 43900, indexed: 43100 },
  { month: "Jul", documents: 46200, indexed: 45500 },
  { month: "Aug", documents: 48392, indexed: 47820 },
];

export const equipmentHealth = [
  { name: "Optimal", value: 812, color: "var(--color-success)" },
  { name: "Monitor", value: 254, color: "var(--color-info)" },
  { name: "Warning", value: 91, color: "var(--color-warning)" },
  { name: "Critical", value: 47, color: "var(--color-destructive)" },
];

export const complianceTrend = [
  { month: "Mar", score: 89.2 },
  { month: "Apr", score: 90.4 },
  { month: "May", score: 91.8 },
  { month: "Jun", score: 92.9 },
  { month: "Jul", score: 93.7 },
  { month: "Aug", score: 94.6 },
];

export const maintenanceTrend = [
  { week: "W1", scheduled: 42, completed: 40, overdue: 2 },
  { week: "W2", scheduled: 51, completed: 47, overdue: 4 },
  { week: "W3", scheduled: 38, completed: 36, overdue: 2 },
  { week: "W4", scheduled: 46, completed: 44, overdue: 2 },
  { week: "W5", scheduled: 55, completed: 52, overdue: 3 },
  { week: "W6", scheduled: 49, completed: 48, overdue: 1 },
];

export const equipment = [
  { id: "P-101", name: "Centrifugal Pump P-101", area: "Unit 3 — Crude Distillation", health: 92, status: "Optimal", rul: 412, lastService: "2026-05-14" },
  { id: "C-204", name: "Reciprocating Compressor C-204", area: "Gas Processing", health: 71, status: "Monitor", rul: 168, lastService: "2026-04-02" },
  { id: "B-17", name: "Boiler B-17 (750 t/h)", area: "Utilities — Steam Gen", health: 58, status: "Warning", rul: 92, lastService: "2026-03-18" },
  { id: "V-303", name: "Control Valve V-303", area: "Reactor Loop A", health: 88, status: "Optimal", rul: 305, lastService: "2026-06-01" },
  { id: "HX-88", name: "Shell & Tube Exchanger HX-88", area: "Heat Recovery", health: 34, status: "Critical", rul: 21, lastService: "2026-01-09" },
  { id: "M-512", name: "Induction Motor M-512 (2.2 MW)", area: "Rolling Mill 2", health: 81, status: "Monitor", rul: 240, lastService: "2026-05-27" },
  { id: "T-401", name: "Storage Tank T-401", area: "Tank Farm South", health: 96, status: "Optimal", rul: 720, lastService: "2026-06-19" },
  { id: "FAN-09", name: "Cooling Tower Fan FAN-09", area: "Cooling Water", health: 66, status: "Monitor", rul: 145, lastService: "2026-04-22" },
];

export const documents = [
  { id: "DOC-88231", name: "P&ID — Crude Distillation Unit 3 Rev 12", type: "Engineering Drawing", size: "18.4 MB", dept: "Process", updated: "2h ago", tags: ["P&ID", "Rev 12", "Unit 3"] },
  { id: "DOC-88190", name: "SOP — Boiler B-17 Cold Startup", type: "SOP", size: "1.2 MB", dept: "Operations", updated: "5h ago", tags: ["Boiler", "Startup", "Safety"] },
  { id: "DOC-88144", name: "Inspection Report — Pump P-101 Q3", type: "Inspection", size: "3.8 MB", dept: "Reliability", updated: "1d ago", tags: ["Vibration", "Alignment"] },
  { id: "DOC-88098", name: "HAZOP Study — Reactor Loop A", type: "Safety Study", size: "6.7 MB", dept: "HSE", updated: "1d ago", tags: ["HAZOP", "Reactor"] },
  { id: "DOC-87901", name: "Maintenance Log — Compressor C-204", type: "Maintenance Log", size: "820 KB", dept: "Maintenance", updated: "2d ago", tags: ["Compressor", "Overhaul"] },
  { id: "DOC-87840", name: "Compliance Certificate — PESO Storage T-401", type: "Certificate", size: "412 KB", dept: "Compliance", updated: "3d ago", tags: ["PESO", "Storage"] },
  { id: "DOC-87712", name: "Root Cause Analysis — HX-88 Tube Leak", type: "RCA", size: "4.1 MB", dept: "Reliability", updated: "4d ago", tags: ["RCA", "Failure"] },
  { id: "DOC-87680", name: "ISO 55001 Asset Management Manual", type: "Manual", size: "12.9 MB", dept: "Quality", updated: "1w ago", tags: ["ISO", "Assets"] },
];

export const notifications = [
  { id: 1, type: "critical", title: "HX-88 tube leak detected", desc: "Vibration + temp anomaly on Shell & Tube Exchanger HX-88. Predicted failure in 21 days.", time: "12 min ago", read: false },
  { id: 2, type: "compliance", title: "PESO certificate expires in 14 days", desc: "Tank T-401 storage license renewal required.", time: "1h ago", read: false },
  { id: 3, type: "ai", title: "AI Copilot indexed 240 new documents", desc: "OCR + entity extraction complete for Unit 3 handover set.", time: "3h ago", read: false },
  { id: 4, type: "maintenance", title: "Boiler B-17 preventive maintenance due", desc: "Scheduled window: Sep 12, 02:00 – 08:00.", time: "6h ago", read: true },
  { id: 5, type: "ai", title: "New insight: recurring seal failure in Pump P-101 family", desc: "3 similar failures in the past 90 days across P-101, P-108, P-115.", time: "yesterday", read: true },
  { id: 6, type: "compliance", title: "ISO 14001 internal audit scheduled", desc: "HSE audit window Sep 20 – Sep 24.", time: "yesterday", read: true },
];

export const recentUploads = [
  { name: "Turbine-GT2-Overhaul-Report.pdf", user: "R. Iyer", size: "24.1 MB", status: "Indexed", time: "8 min ago" },
  { name: "P&ID-Rev12-Unit3.dwg", user: "S. Malhotra", size: "18.4 MB", status: "Embedding", time: "14 min ago" },
  { name: "SOP-Cold-Startup-B17.docx", user: "A. Karim", size: "1.2 MB", status: "Ready", time: "22 min ago" },
  { name: "Inspection-Q3-2026.xlsx", user: "L. Chen", size: "3.6 MB", status: "OCR", time: "31 min ago" },
];

export const conversations = [
  { id: "c1", title: "Root cause — HX-88 tube leak", time: "Today", pinned: true },
  { id: "c2", title: "Startup procedure for Boiler B-17", time: "Today", pinned: false },
  { id: "c3", title: "PESO compliance checklist Tank T-401", time: "Yesterday", pinned: true },
  { id: "c4", title: "Vibration signature Compressor C-204", time: "Yesterday", pinned: false },
  { id: "c5", title: "ISO 55001 gap analysis summary", time: "3 days ago", pinned: false },
  { id: "c6", title: "Recurring seal failure Pump P-101 family", time: "1 week ago", pinned: false },
];

export const suggestedPrompts = [
  { icon: "Wrench", title: "Diagnose HX-88 tube leak", desc: "Cross-reference vibration data + inspection reports" },
  { icon: "ShieldCheck", title: "Summarize PESO compliance status", desc: "For all storage tanks in Tank Farm South" },
  { icon: "FileSearch", title: "Find SOPs for cold startup", desc: "Filter by Utilities — Boiler equipment" },
  { icon: "TrendingUp", title: "Predict RUL for Compressor C-204", desc: "Based on last 12 months of sensor telemetry" },
];

export const industries = [
  { name: "Manufacturing", icon: "Factory", stats: "1,240+ plants" },
  { name: "Oil & Gas", icon: "Fuel", stats: "380+ facilities" },
  { name: "Energy & Power", icon: "Zap", stats: "520+ plants" },
  { name: "Mining", icon: "Mountain", stats: "180+ sites" },
  { name: "Steel", icon: "Hammer", stats: "95+ mills" },
  { name: "Pharmaceutical", icon: "FlaskConical", stats: "210+ facilities" },
  { name: "Chemicals", icon: "TestTubes", stats: "340+ plants" },
  { name: "Infrastructure", icon: "Building2", stats: "610+ projects" },
];

export const features = [
  { icon: "Sparkles", title: "AI Copilot", desc: "Ask any question about your plant. Get answers with cited sources from 40k+ documents." },
  { icon: "Network", title: "Knowledge Graph", desc: "Every asset, drawing, incident, and SOP linked into a living operational brain." },
  { icon: "TrendingUp", title: "Predictive Maintenance", desc: "Forecast failures weeks in advance using sensor telemetry + historical work orders." },
  { icon: "ShieldCheck", title: "Compliance Intelligence", desc: "Track ISO 55001, OISD, PESO, Factory Act, ISO 14001 continuously — not once a year." },
  { icon: "FileSearch", title: "Semantic Document Search", desc: "Search meaning, not keywords. Across PDFs, DWGs, scans, Excel, and emails." },
  { icon: "GitBranch", title: "Root Cause Analysis", desc: "AI-assisted RCA in minutes: pulls incident history, drawings, and expert notes." },
  { icon: "ScanText", title: "OCR + Entity Extraction", desc: "Understands scanned drawings, handwritten logs, and legacy vendor manuals." },
  { icon: "PenTool", title: "Engineering Drawings", desc: "Native P&ID, isometric, and GA drawing understanding with tag-level linking." },
  { icon: "History", title: "Full Asset History", desc: "Every touchpoint of every asset — from commissioning to today — one timeline." },
];

export const complianceStandards = [
  { code: "ISO 55001", name: "Asset Management", status: "Compliant", score: 96, next: "Sep 20" },
  { code: "ISO 14001", name: "Environmental", status: "Compliant", score: 92, next: "Oct 04" },
  { code: "ISO 45001", name: "Occupational H&S", status: "Compliant", score: 89, next: "Oct 18" },
  { code: "OISD-116", name: "Fire Protection", status: "Action Needed", score: 78, next: "Sep 12" },
  { code: "PESO", name: "Petroleum & Explosives", status: "Compliant", score: 94, next: "Sep 26" },
  { code: "Factory Act", name: "Statutory (India)", status: "Compliant", score: 91, next: "Nov 02" },
];
