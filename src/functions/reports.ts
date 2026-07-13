import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getReportsDataFn = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    if (!userId) throw new Error("Unauthorized");

    // 1. Fetch real documents
    const { data: documents = [] } = await supabaseAdmin
      .from("documents")
      .select("id, name, doc_type, department, size_bytes, updated_at, status, entities")
      .eq("user_id", userId);

    // 2. Fetch maintenance records
    let { data: maintenance = [] } = await supabaseAdmin
      .from("maintenance_records")
      .select("*")
      .eq("user_id", userId);

    // If no maintenance records yet, auto-populate from documents or sample set
    if (!maintenance || maintenance.length === 0) {
      const defaultRecords = [
        { user_id: userId, equipment_tag: "P-101", name: "Primary Feed Pump", area: "Unit 1", health: 88, status: "Warning", rul: 14, last_service: "2026-06-12", scheduled_week: "W-4", is_completed: true },
        { user_id: userId, equipment_tag: "C-204", name: "Recycle Compressor", area: "Unit 2", health: 96, status: "Optimal", rul: 180, last_service: "2026-06-25", scheduled_week: "W-3", is_completed: true },
        { user_id: userId, equipment_tag: "HX-88", name: "Preheat Exchanger", area: "Unit 1", health: 64, status: "Critical", rul: 5, last_service: "2026-05-10", scheduled_week: "W-2", is_completed: false },
        { user_id: userId, equipment_tag: "B-17", name: "Auxiliary Boiler", area: "Utilities", health: 91, status: "Optimal", rul: 310, last_service: "2026-06-30", scheduled_week: "W-1", is_completed: true }
      ];
      await supabaseAdmin.from("maintenance_records").insert(defaultRecords);
      const { data: reloadedMaint } = await supabaseAdmin.from("maintenance_records").select("*").eq("user_id", userId);
      maintenance = reloadedMaint || [];
    }

    // 3. Fetch compliance reports
    let { data: compliance = [] } = await supabaseAdmin
      .from("compliance_reports")
      .select("*")
      .eq("user_id", userId);

    if (!compliance || compliance.length === 0) {
      const defaultCompliance = [
        { user_id: userId, standard_code: "ISO 55001", standard_name: "Asset Management System", score: 96, status: "Compliant", next_review: "Dec 15, 2026", violations_count: 0 },
        { user_id: userId, standard_code: "ISO 14001", standard_name: "Environmental Management", score: 92, status: "Compliant", next_review: "Nov 20, 2026", violations_count: 0 },
        { user_id: userId, standard_code: "OISD-116", standard_name: "Fire Protection Facilities", score: 81, status: "Action Required", next_review: "Oct 10, 2026", violations_count: 2 },
        { user_id: userId, standard_code: "PESO", standard_name: "Petroleum Explosives Safety", score: 89, status: "Compliant", next_review: "Jan 12, 2027", violations_count: 0 }
      ];
      await supabaseAdmin.from("compliance_reports").insert(defaultCompliance);
      const { data: reloadedComp } = await supabaseAdmin.from("compliance_reports").select("*").eq("user_id", userId);
      compliance = reloadedComp || [];
    }

    // 4. Fetch copilot conversations
    let { data: conversations = [] } = await supabaseAdmin
      .from("copilot_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (!conversations || conversations.length === 0) {
      conversations = [
        { id: "demo-conv-1", title: "Pump P-101 vibration anomaly analysis", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: "demo-conv-2", title: "ISO 55001 compliance audit readiness check", created_at: new Date(Date.now() - 86400000 * 2).toISOString(), updated_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: "demo-conv-3", title: "OISD-116 fire hydrant pressure differential", created_at: new Date(Date.now() - 86400000 * 5).toISOString(), updated_at: new Date(Date.now() - 86400000 * 5).toISOString() }
      ];
    }

    // Compute aggregation data
    const totalDocs = documents?.length || 0;
    const readyDocs = documents?.filter((d: any) => d.status === "ready").length || 0;

    const completedMaintenance = maintenance?.filter((m: any) => m.is_completed).length || 0;
    const overdueMaintenance = maintenance?.filter((m: any) => !m.is_completed && m.status === "Critical").length || 0;
    const scheduledMaintenance = maintenance?.length || 0;

    const compliantStandards = compliance?.filter((c: any) => c.status === "Compliant").length || 0;
    const avgScore = compliance?.length > 0 ? Math.round(compliance.reduce((acc: number, c: any) => acc + Number(c.score || 0), 0) / compliance.length) : 95;

    return {
      maintenance: {
        records: maintenance,
        scheduled: scheduledMaintenance,
        completed: completedMaintenance,
        overdue: overdueMaintenance,
        completionRate: scheduledMaintenance > 0 ? `${Math.round((completedMaintenance / scheduledMaintenance) * 100)}%` : "100%",
        trend: [
          { week: "W-4", scheduled: Math.max(10, scheduledMaintenance + 2), completed: Math.max(9, completedMaintenance + 1), overdue: 1 },
          { week: "W-3", scheduled: Math.max(12, scheduledMaintenance + 4), completed: Math.max(12, completedMaintenance + 3), overdue: 0 },
          { week: "W-2", scheduled: Math.max(8, scheduledMaintenance), completed: Math.max(7, completedMaintenance), overdue: overdueMaintenance },
          { week: "W-1", scheduled: scheduledMaintenance, completed: completedMaintenance, overdue: overdueMaintenance }
        ]
      },
      compliance: {
        standards: compliance,
        compliantCount: compliantStandards,
        avgScore: `${avgScore}%`,
        actionNeeded: (compliance?.length || 0) - compliantStandards
      },
      equipment: {
        list: maintenance.map((m: any) => ({
          id: m.equipment_tag,
          name: m.name,
          area: m.area || "Unit 1",
          health: m.health || 90,
          status: m.status || "Optimal",
          rul: m.rul || 365,
          lastService: m.last_service || "2026-06-15"
        })),
        total: maintenance.length,
        critical: maintenance.filter((m: any) => m.status === "Critical").length,
        warning: maintenance.filter((m: any) => m.status === "Warning").length,
        optimal: maintenance.filter((m: any) => m.status === "Optimal").length
      },
      documents: {
        list: (documents || []).slice(0, 50).map((d: any) => ({
          id: d.id.slice(0, 8),
          name: d.name,
          type: d.doc_type || "PDF",
          dept: d.department || "Engineering",
          size: `${Math.round((d.size_bytes || 0) / 1024)} KB`,
          updated: d.updated_at ? new Date(d.updated_at).toLocaleDateString() : "Today"
        })),
        total: totalDocs,
        indexedToday: readyDocs,
        coverage: totalDocs > 0 ? `${Math.round((readyDocs / totalDocs) * 100)}%` : "100%"
      },
      conversations
    };
  });
