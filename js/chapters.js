// 章節閱讀視圖 — 支援小節 sections[] + 兩層大綱 TOC + 小節捲動高亮
(function () {
  const data = window.DATA;
  const periodMap = Object.fromEntries(data.periods.map(p => [p.id, p]));
  const typeLabel = { person: "人物", tool: "工具", concept: "概念", project: "案例", lab: "實驗室" };

  // 內文自動連結:把段落裡提到的 entity 名稱變成可點連結(每章只連第一次提到)
  const linkTerms = [];
  data.entities.forEach(e => {
    if (e.name) linkTerms.push({ term: e.name, id: e.id });
    if (e.nameEn && e.nameEn !== e.name) linkTerms.push({ term: e.nameEn, id: e.id });
  });
  linkTerms.sort((a, b) => b.term.length - a.term.length); // 長詞優先,避免被短詞先吃掉

  const ASCII = /[A-Za-z0-9]/;
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function autolink(text, linkedIds) {
    let out = "", i = 0;
    while (i < text.length) {
      let hit = null;
      for (const lt of linkTerms) {
        if (linkedIds.has(lt.id)) continue;            // 一章只連第一次
        if (!text.startsWith(lt.term, i)) continue;
        if (ASCII.test(lt.term[0])) {                  // ASCII 詞檢查邊界,避免 CAD 命中 AutoCAD
          const before = i > 0 ? text[i - 1] : "";
          const after = text[i + lt.term.length] || "";
          if (ASCII.test(before) || ASCII.test(after)) continue;
        }
        hit = lt; break;
      }
      if (hit) {
        out += `<span class="ch-inline" data-id="${hit.id}">${escapeHtml(hit.term)}</span>`;
        linkedIds.add(hit.id);
        i += hit.term.length;
      } else {
        out += escapeHtml(text[i]);
        i++;
      }
    }
    return out;
  }
  const para = (t, ids) => `<p>${autolink(t, ids)}</p>`;

  // 右側欄用:列出一段文字裡提到的所有詞條(依出現順序,不受「每章只連一次」限制)
  const termsByFirst = {};
  linkTerms.forEach(lt => (termsByFirst[lt.term[0]] ||= []).push(lt));
  function collectMentions(text, acc) {
    let i = 0;
    while (i < text.length) {
      let hit = null;
      for (const lt of termsByFirst[text[i]] || []) {
        if (!text.startsWith(lt.term, i)) continue;
        if (ASCII.test(lt.term[0])) {
          const before = i > 0 ? text[i - 1] : "";
          const after = text[i + lt.term.length] || "";
          if (ASCII.test(before) || ASCII.test(after)) continue;
        }
        hit = lt; break;
      }
      if (hit) { acc.add(hit.id); i += hit.term.length; } else i++;
    }
    return acc;
  }

  // ── TOC(兩層:章 → 小節)──
  const toc = document.getElementById("toc");
  toc.innerHTML = data.chapters.map(c => {
    const p = periodMap[c.periodId];
    const subs = (c.sections && c.sections.length)
      ? `<ul class="toc-sub">${c.sections.map(s => `<li><a href="#${s.id}" data-target="${s.id}" class="toc-sub-link">${s.heading}</a></li>`).join("")}</ul>`
      : "";
    return `<li>
      <a href="#${c.id}" data-target="${c.id}">${c.title}<span class="toc-years">${p.years}</span></a>
      ${subs}
    </li>`;
  }).join("");

  // ── 章節主體 ──
  const root = document.getElementById("chapters");
  root.innerHTML = data.chapters.map((c, idx) => {
    const p = periodMap[c.periodId];
    const linkedIds = new Set();               // 整章共用(含 lead / intro / 各小節)
    const intro = (c.paragraphs || []).map(t => para(t, linkedIds)).join("");
    const sections = (c.sections || []).map(s => `
      <section class="ch-sub" id="${s.id}">
        <h3 class="ch-subhead">${escapeHtml(s.heading)}</h3>
        ${s.paragraphs.map(t => para(t, linkedIds)).join("")}
      </section>`).join("");

    // 該時期的實體分類(章末「此時期相關」)
    const ents = data.entities.filter(e => e.periodId === c.periodId);
    const tagsByType = ["person", "tool", "concept", "project", "lab"]
      .map(t => ents.filter(e => e.type === t).sort((a, b) => a.year - b.year))
      .filter(arr => arr.length)
      .map(arr => arr.map(e => `<span class="ch-tag" data-id="${e.id}" style="border-left-color: ${p.color}"><span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-3);">${typeLabel[e.type]}</span> ${e.name}</span>`).join(""))
      .join("");

    const sources = (c.sources && c.sources.length) ? `
      <div class="ch-sources">
        <h4>來源</h4>
        <ol>${c.sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a></li>`).join("")}</ol>
      </div>` : "";

    return `
      <section class="chapter" id="${c.id}" data-period="${c.periodId}">
        <div class="ch-num">Chapter ${String(idx + 1).padStart(2, "0")} · ${p.subtitle}</div>
        <h2>${c.title}</h2>
        <div class="ch-years">${p.years}</div>
        <p class="lead" style="border-left-color: ${p.color}">${autolink(c.lead, linkedIds)}</p>
        ${intro}
        ${sections}
        ${sources}
        <div class="ch-tags">
          <h4>此時期相關</h4>
          <div class="ch-tag-grid">${tagsByType}</div>
        </div>
      </section>`;
  }).join("");

  // 點 tag / 內文連結 開 modal
  root.addEventListener("click", e => {
    const el = e.target.closest(".ch-tag, .ch-inline");
    if (!el) return;
    window.__openEntity(el.dataset.id);
  });

  // ── 窄螢幕:目錄可折疊 ──
  const tocNav = toc.closest(".ch-toc");
  const tocToggle = tocNav.querySelector(".toc-toggle");
  const narrow = window.matchMedia("(max-width: 900px)");
  const setTocOpen = open => {
    tocNav.classList.toggle("open", open);
    tocToggle.setAttribute("aria-expanded", String(open));
  };
  tocToggle.addEventListener("click", () => {
    if (narrow.matches) setTocOpen(!tocNav.classList.contains("open"));
  });

  // TOC 平滑捲動
  toc.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", ev => {
      ev.preventDefault();
      if (narrow.matches) setTocOpen(false);
      const el = document.getElementById(a.dataset.target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // ── 捲動高亮(小節優先,連帶高亮父章)──
  const tocLinks = [...toc.querySelectorAll("a")];
  const subToChapter = {};
  data.chapters.forEach(c => (c.sections || []).forEach(s => subToChapter[s.id] = c.id));

  const observeTargets = [];
  data.chapters.forEach(c => {
    if (c.sections && c.sections.length) c.sections.forEach(s => observeTargets.push(document.getElementById(s.id)));
    else observeTargets.push(document.getElementById(c.id));
  });

  const tocBox = toc.closest(".ch-toc");
  const keepVisible = a => {
    if (tocBox.scrollHeight <= tocBox.clientHeight) return;
    const box = tocBox.getBoundingClientRect(), r = a.getBoundingClientRect();
    if (r.top < box.top + 40 || r.bottom > box.bottom - 40)
      tocBox.scrollTo({ top: tocBox.scrollTop + (r.top - box.top) - tocBox.clientHeight / 3, behavior: "smooth" });
  };

  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      tocLinks.forEach(a => a.classList.remove("active"));
      const link = toc.querySelector(`a[data-target="${id}"]`);
      if (link) { link.classList.add("active"); keepVisible(link); }
      const chId = subToChapter[id];
      if (chId) { const cl = toc.querySelector(`a[data-target="${chId}"]`); if (cl) cl.classList.add("active"); }
    });
  }, { rootMargin: "-25% 0px -65% 0px" });
  observeTargets.filter(Boolean).forEach(t => obs.observe(t));

  // ── 右側欄:本節提到的詞條(寬螢幕才顯示)──
  const rail = document.getElementById("ch-rail");
  const entById = Object.fromEntries(data.entities.map(e => [e.id, e]));
  const blocks = [];                          // 依文件順序:章導言 → 各小節
  data.chapters.forEach(c => {
    const intro = collectMentions(c.lead || "", new Set());
    (c.paragraphs || []).forEach(t => collectMentions(t, intro));
    blocks.push({ el: document.getElementById(c.id), title: c.title, ids: [...intro] });
    (c.sections || []).forEach(sec => {
      const ids = new Set();
      sec.paragraphs.forEach(t => collectMentions(t, ids));
      blocks.push({ el: document.getElementById(sec.id), title: sec.heading, ids: [...ids] });
    });
  });

  let shown = null;
  function renderRail(b) {
    if (b === shown) return;
    shown = b;
    const items = b.ids.map(id => entById[id]).filter(Boolean).map(e => {
      const color = (periodMap[e.periodId] || {}).color || "var(--line-2)";
      return `<li><button type="button" class="rail-item" data-id="${e.id}" style="border-left-color: ${color}">
        <span class="rail-meta"><span>${typeLabel[e.type]}</span><span>${e.year}</span></span>
        <span class="rail-name">${escapeHtml(e.name)}</span>
      </button></li>`;
    }).join("");
    rail.innerHTML = `
      <h4>本節提到的詞條</h4>
      <div class="rail-sec">${escapeHtml(b.title)}</div>
      ${items ? `<ol class="rail-list">${items}</ol>` : `<p class="rail-empty">這一節沒有提到站內詞條。</p>`}`;
    rail.scrollTop = 0;
  }
  rail.addEventListener("click", e => {
    const el = e.target.closest(".rail-item");
    if (el) window.__openEntity(el.dataset.id);
  });

  let ticking = false;
  function updateRail() {
    ticking = false;
    if (getComputedStyle(rail).display === "none") return;
    const line = window.innerHeight * 0.35;
    let cur = blocks[0];
    for (const b of blocks) {
      if (b.el && b.el.getBoundingClientRect().top <= line) cur = b; else break;
    }
    if (cur) renderRail(cur);
  }
  const queueRail = () => { if (!ticking) { ticking = true; requestAnimationFrame(updateRail); } };
  window.addEventListener("scroll", queueRail, { passive: true });
  window.addEventListener("resize", queueRail);
  updateRail();
})();
