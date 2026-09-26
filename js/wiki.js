// Wikipedia 連結 — 共用 helper
// 機制:用 Special:Search 的 "go" 行為 — 精確標題直接跳到條目,否則顯示搜尋結果(不會 404)
// 要改語言:把 LANG 改成 "zh" 即可(注意:數位建築冷門詞條在中文維基覆蓋較少)
window.WIKI = (function () {
  const LANG = "en";

  // id → 覆寫。值可為:① 搜尋詞字串 ② 完整 http(s) URL ③ null(不顯示連結)
  // 沒列在這裡的 entity,一律用 nameEn || name 當搜尋詞
  // 多為「名稱會撞名」或「無對應條目、改連母概念」的情況
  const OVERRIDES = {
    tectonism:           "Parametricism",            // 英文維基無獨立條目
    cad:                 "Computer-aided design",
    maya:                "Autodesk Maya",            // 否則撞到馬雅文明
    nurbs:               "Non-uniform rational B-spline",
    blob:                "Blobitecture",
    folding:             "Folding in Architecture",
    rhino:               "Rhinoceros 3D",            // 否則撞到犀牛
    grasshopper:         "Grasshopper 3D",           // 否則撞到蚱蜢
    processing:          "Processing (programming language)",
    houdini:             "Houdini (software)",       // 否則撞到魔術師
    kuka:                "Robotic arm",
    fabrication:         "Digital modeling and fabrication",
    revit:               "Autodesk Revit",
    dynamo:              "Dynamo BIM",
    diffusion:           "Diffusion model",
    aiDesign:            "Generative artificial intelligence",
    algo:                "Algorithmic art",
    generative:          "Generative design",
    materialComputation: "Computational design",     // 無獨立條目 → 連母概念
    frazer:              "John Frazer (architect)",  // 否則撞到其他同名者
    mcneel:              "Rhinoceros 3D",            // 無個人條目 → 連其產品
    silkPavilion:        "Neri Oxman",               // 收錄於其條目
    icditke:             "Achim Menges",
    icdPavilion:         "Achim Menges",
    rutten:              null,                        // 無條目 → 不連
    // ── 擴充詞條(撞名/無條目)──
    formz:               "Form-Z",
    max3ds:              "Autodesk 3ds Max",
    diagram:             null,
    animateform:         "Greg Lynn",
    hypersurface:        null,
    associative:         "Parametric design",
    p5js:                "Processing (programming language)",
    kangaroo:            "Grasshopper 3D",            // 否則撞到袋鼠
    galapagos:           "Genetic algorithm",         // 否則撞到加拉巴哥群島
    lunchbox:            null,
    nervoussystem:       "Nervous System (studio)",   // 否則撞到生物神經系統
    fornesPavilion:      "Marc Fornes",
    filetofactory:       "Digital modeling and fabrication",
    digitalmateriality:  "Gramazio & Kohler",
    kukaprc:             "KUKA",
    concreteprinting:    "Construction 3D printing",
    digitalgrotesque:    "Michael Hansmeyer",
    striatus:            "Block Research Group",
    rhinoinside:         "Autodesk Revit",
    speckle:             null,
    bim360:              "Building information modeling",
    veras:               null,
    testfit:             null,
    zhacode:             "Zaha Hadid",
    // ── 章節擴充新增(撞名)──
    wesleyclark:         "Wesley A. Clark",                          // 否則撞到 Wesley Clark 將軍
    swordofdamocles:     "The Sword of Damocles (virtual reality)",  // 否則撞到典故/電影
    tx2:                 "TX-2",
    evanssutherland:     "Evans & Sutherland",
    johnwalker:          "John Walker (programmer)",                 // 否則撞到一堆同名者
    seek:                null,                                       // 無乾淨條目 → 不連(已有 cyberneticzoo 來源)
    decasteljau:         "Paul de Casteljau",
    coons:               "Steven Anson Coons",
    barcelonafish:       null,                                       // 無乾淨條目 → 不連(已有 Gehry 來源)
    vitra:               "Vitra Design Museum",
    metaball:            "Metaballs",
    objectile:           "Bernard Cache",
    waterpavilion:       "Lars Spuybroek",
    foa:                 "Foreign Office Architects",
    whitehead:           null,                                       // 無個人條目 → 不連(已有 SmartGeometry 來源)
    reynolds:            "Craig Reynolds (computer graphics)",       // 否則撞到一堆同名者
    hyfi:                "The Living (architecture firm)",
    gantenbein:          "Gramazio & Kohler",
    thrustnetwork:       "Philippe Block",
    khoshnevis:          "Contour crafting",
    dfabhouse:           null,
    smartbuilding:       "Building automation",
    archigan:            null,                                       // 無乾淨條目 → 不連(已有 NVIDIA 來源)
    ml:                  "Machine learning"
  };

  function build(term) {
    return "https://" + LANG + ".wikipedia.org/w/index.php?title=Special:Search&search=" +
           encodeURIComponent(term) + "&go=Go";
  }

  return {
    lang: LANG,
    url(e) {
      if (!e) return null;
      const has = Object.prototype.hasOwnProperty.call(OVERRIDES, e.id);
      const o = has ? OVERRIDES[e.id] : undefined;
      if (o === null) return null;                                  // 明確不連
      if (typeof o === "string" && /^https?:/i.test(o)) return o;   // 完整 URL
      const term = (typeof o === "string" && o) ? o : (e.nameEn || e.name);
      return build(term);
    }
  };
})();
