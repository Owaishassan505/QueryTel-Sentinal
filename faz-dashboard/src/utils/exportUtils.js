import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToCSV(data, filename = "logs.csv") {
    if (!data?.length) return;
    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(","),
        ...data.map((row) =>
            headers.map((key) => JSON.stringify(row[key] ?? "")).join(",")
        ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function exportToPDF(data, filename = "logs.pdf") {
    if (!data?.length) return;
    const doc = new jsPDF();
    const headers = Object.keys(data[0]);
    const body = data.map((r) => headers.map((k) => String(r[k] ?? "")));
    autoTable(doc, { head: [headers], body });
    doc.save(filename);
}
