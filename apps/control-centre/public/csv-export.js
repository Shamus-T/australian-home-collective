import { buildCsvExport, UTF8_BOM } from "./csv-export-lib.js";

const period = document.querySelector("#period");
const statusElement = document.querySelector("#status");

function setStatus(message, type = "") {
  statusElement.textContent = message;
  statusElement.className = `status${type ? ` is-${type}` : ""}`;
}

async function fetchOverview() {
  const response = await fetch(`/api/overview?days=${encodeURIComponent(period.value)}`, {
    headers: { Accept: "application/json" },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok && response.status !== 207) {
    throw new Error(body?.message ?? `Export request failed (${response.status}).`);
  }
  return body;
}

function downloadCsv(filename, csv) {
  const blob = new Blob([UTF8_BOM, csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportDataset(button) {
  const key = button.dataset.csvExport;
  button.disabled = true;
  setStatus(`Preparing ${button.dataset.csvLabel ?? "CSV"} export…`);
  try {
    const dashboard = await fetchOverview();
    const exported = buildCsvExport(key, dashboard);
    downloadCsv(exported.filename, exported.csv);
    const rows = `${exported.rowCount} row${exported.rowCount === 1 ? "" : "s"}`;
    setStatus(`Exported ${exported.label}: ${rows} in ${exported.filename}.`, "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "The CSV export failed.", "error");
  } finally {
    button.disabled = false;
  }
}

for (const button of document.querySelectorAll("[data-csv-export]")) {
  button.addEventListener("click", () => exportDataset(button));
}
