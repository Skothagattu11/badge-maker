import type { BadgeSpec, GenerationResult } from "./types.js";

export interface BadgeResult {
  badge: BadgeSpec;
  results: GenerationResult[];
}

export function generateReport(badgeResults: BadgeResult[]): string {
  const rows = badgeResults.map(({ badge, results }) => {
    const cells = results.map((r) => {
      const imgTag = r.imageBuffer
        ? `<img src="data:image/png;base64,${r.imageBuffer.toString("base64")}" alt="${r.label}" />`
        : `<div class="error">${r.error ?? "Unknown error"}</div>`;

      const cost = r.costUsd != null ? `$${r.costUsd.toFixed(2)}` : "~compute";
      const timing = `${(r.timingMs / 1000).toFixed(1)}s`;

      return `
        <div class="cell">
          <div class="model-label">${r.label}</div>
          ${imgTag}
          <div class="meta">&#x23F1; ${timing} &nbsp; &#x1F4B2; ${cost}</div>
          <div class="notes" contenteditable="true" data-model="${r.modelId}" data-badge="${badge.id}" placeholder="Your notes..."></div>
        </div>`;
    }).join("");

    return `
      <section class="badge-row">
        <h2>${badge.name} <span class="badge-meta">${badge.category} / ${badge.rarity}</span></h2>
        <p class="achievement">${badge.achievement}</p>
        <div class="grid">${cells}</div>
      </section>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Badge Model Comparison &#x2014; Entropy</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #091640; color: #F3D890; font-family: system-ui, sans-serif; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #F3D890; }
    .subtitle { color: #BCC5CE; margin-bottom: 2rem; font-size: 0.875rem; }
    header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; }
    button { background: #D6A74F; color: #091640; border: none; padding: 0.5rem 1.25rem; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.875rem; }
    button:hover { background: #F3D890; }
    .badge-row { margin-bottom: 3rem; }
    h2 { font-size: 1.125rem; margin-bottom: 0.25rem; }
    .badge-meta { color: #BCC5CE; font-size: 0.8rem; font-weight: 400; }
    .achievement { color: #BCC5CE; font-size: 0.8rem; margin-bottom: 1rem; }
    .grid { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .cell { background: #0D1E3D; border-radius: 8px; padding: 1rem; width: 320px; }
    .model-label { font-size: 0.75rem; font-weight: 600; color: #D6A74F; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.75rem; }
    .cell img { width: 100%; border-radius: 4px; display: block; }
    .error { width: 100%; aspect-ratio: 1; background: #15191F; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #e05c5c; font-size: 0.8rem; padding: 1rem; text-align: center; }
    .meta { font-size: 0.75rem; color: #BCC5CE; margin-top: 0.5rem; }
    .notes { margin-top: 0.5rem; min-height: 60px; background: #091640; border: 1px solid #1A3A6A; border-radius: 4px; padding: 0.5rem; font-size: 0.8rem; color: #BCC5CE; outline: none; }
    .notes:empty::before { content: attr(placeholder); color: #1A3A6A; }
    .notes:focus { border-color: #D6A74F; }
    #toast { display: none; position: fixed; bottom: 1.5rem; right: 1.5rem; background: #D6A74F; color: #091640; padding: 0.5rem 1rem; border-radius: 4px; font-size: 0.875rem; font-weight: 600; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Badge Model Comparison</h1>
      <p class="subtitle">Entropy achievement badge system &#x2014; model evaluation</p>
    </div>
    <button onclick="exportRatings()">Export ratings</button>
  </header>
  ${rows}
  <div id="toast">Copied to clipboard!</div>
  <script>
    function exportRatings() {
      const notes = {};
      document.querySelectorAll('.notes').forEach(el => {
        const key = el.dataset.badge + '/' + el.dataset.model;
        if (el.textContent.trim()) notes[key] = el.textContent.trim();
      });
      navigator.clipboard.writeText(JSON.stringify(notes, null, 2));
      const toast = document.getElementById('toast');
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 2000);
    }
  </script>
</body>
</html>`;
}
