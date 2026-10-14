// 時間軸視圖:橫向 = 時期,縱向 = 實體類型
(function () {
  const root = document.getElementById("timeline");
  if (!root) return;

  const data = window.DATA;
  const periods = data.periods;
  const typeRows = [
    { key: "person",  label: "人物" },
    { key: "tool",    label: "工具" },
    { key: "concept", label: "概念" },
    { key: "project", label: "案例" },
    { key: "lab",     label: "實驗室" }
  ];

  // 時期軸
  const axis = document.createElement("div");
  axis.className = "timeline-axis";
  axis.innerHTML = `<div class="tl-axis-spacer"></div>` + periods.map(p => `
    <div class="tl-period" style="flex:1; border-top-color: ${p.color}">
      <div class="tl-period-label">${p.name}</div>
      <div class="tl-period-sub">${p.subtitle}</div>
      <div class="tl-period-years">${p.years}</div>
    </div>
  `).join("");
  root.appendChild(axis);

  // 內容行
  const rows = document.createElement("div");
  rows.className = "tl-rows";
  rows.innerHTML = typeRows.map(t => {
    const cells = periods.map(p => {
      const items = data.entities.filter(e => e.type === t.key && e.periodId === p.id)
        .sort((a, b) => a.year - b.year);
      const chips = items.map(e => `
        <span class="tl-chip" data-id="${e.id}" style="border-left-color: ${p.color}">
          <span>${e.name}</span>
          <span class="year">${e.year}</span>
        </span>
      `).join("");
      return `<div class="tl-cell">${chips}</div>`;
    }).join("");
    return `
      <div class="tl-row">
        <div class="tl-row-label">${t.label}</div>
        <div class="tl-row-track">${cells}</div>
      </div>
    `;
  }).join("");
  root.appendChild(rows);

  // 點擊 chip → modal
  root.addEventListener("click", e => {
    const chip = e.target.closest(".tl-chip");
    if (!chip) return;
    window.__openEntity(chip.dataset.id);
  });
})();
