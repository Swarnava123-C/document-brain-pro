// Report exports — PDF (jspdf + autotable) and CSV (papaparse).
import Papa from "papaparse";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

export function exportCSV(filename: string, rows: Record<string, unknown>[]) {
  const csv = Papa.unparse(rows);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export async function exportPDF(opts: {
  filename: string;
  title: string;
  subtitle?: string;
  kpis?: { label: string; value: string }[];
  columns: string[];
  rows: (string | number)[][];
}) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageW, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("IndustrialMind AI", 40, 28);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text("Industrial Knowledge Intelligence Platform", 40, 44);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleString(), pageW - 40, 36, { align: "right" });

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold"); doc.setFontSize(18);
  doc.text(opts.title, 40, 100);
  if (opts.subtitle) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(opts.subtitle, 40, 118);
  }

  let cursorY = 140;
  if (opts.kpis?.length) {
    const cellW = (pageW - 80) / opts.kpis.length;
    opts.kpis.forEach((k, i) => {
      const x = 40 + i * cellW;
      doc.setDrawColor(230); doc.setFillColor(249, 250, 251);
      doc.roundedRect(x, cursorY, cellW - 10, 56, 6, 6, "FD");
      doc.setFontSize(8); doc.setTextColor(120, 120, 120);
      doc.text(k.label.toUpperCase(), x + 12, cursorY + 20);
      doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 20);
      doc.text(k.value, x + 12, cursorY + 44);
      doc.setFont("helvetica", "normal");
    });
    cursorY += 76;
  }

  autoTable(doc, {
    head: [opts.columns],
    body: opts.rows,
    startY: cursorY,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: 40 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 40, right: 40 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text(`© 2026 IndustrialMind AI  ·  Page ${i} of ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 20, { align: "center" });
  }

  doc.save(opts.filename);
}
