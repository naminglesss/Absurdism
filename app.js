(function () {
  "use strict";

  const LOADING_MS = 920;

  const el = {
    idea: document.getElementById("user-idea"),
    aspect: document.getElementById("aspect"),
    camera: document.getElementById("camera"),
    output: document.getElementById("output"),
    outputWrap: document.getElementById("output-wrap"),
    generate: document.getElementById("btn-generate"),
    copy: document.getElementById("btn-copy"),
    status: document.getElementById("copy-status"),
  };

  const CAR_BRANDS = new Set([
    "ferrari",
    "lamborghini",
    "porsche",
    "mclaren",
    "aston",
    "bmw",
    "mercedes",
    "audi",
    "tesla",
    "maserati",
    "bentley",
    "rolls",
    "bugatti",
    "koenigsegg",
  ]);

  const WATCH_HINTS = new Set([
    "watch",
    "rolex",
    "omega",
    "cartier",
    "patek",
    "ap",
    "audemars",
    "tudor",
    "timepiece",
  ]);

  const GYM_HINTS = new Set(["gym", "workout", "lift", "deadlift", "squat", "crossfit", "fitness"]);

  const CITY_HINTS = {
    dubai: "Dubai",
    tokyo: "Tokyo",
    paris: "Paris",
    london: "London",
    nyc: "New York",
    miami: "Miami",
    la: "Los Angeles",
    monaco: "Monaco",
  };

  function normalizeTokens(text) {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  function detectContext(tokens) {
    const joined = tokens.join(" ");
    const hasCar = tokens.some((t) => CAR_BRANDS.has(t)) || /\b(car|drive|highway|supercar|hypercar|road)\b/i.test(joined);
    const hasWatch = tokens.some((t) => WATCH_HINTS.has(t));
    const hasGym = tokens.some((t) => GYM_HINTS.has(t));
    let city = null;
    for (const t of tokens) {
      if (CITY_HINTS[t]) {
        city = CITY_HINTS[t];
        break;
      }
    }
    return { hasCar, hasWatch, hasGym, city };
  }

  function cameraPhrase(kind) {
    switch (kind) {
      case "android":
        return "handheld Android phone photo, realistic smartphone JPEG processing, mild HDR, not a DSLR render";
      case "compact":
        return "handheld compact camera snapshot, natural color science, slight lens vignette, not CGI";
      default:
        return "handheld iPhone photo, realistic smartphone HDR, natural sharpening, not a studio render";
    }
  }

  function subjectBlock(ctx) {
    if (ctx.hasWatch && !ctx.hasCar) {
      return [
        "SUBJECT & MATERIALS:",
        "Wrist and watch are primary focus; metal, sapphire, and strap texture must look physically correct.",
        "No beauty-filter skin: keep pores and micro-contrast; forbid plastic skin or wax highlights.",
      ].join("\n");
    }
    if (ctx.hasGym) {
      return [
        "SUBJECT & CONTINUITY:",
        "Athlete looks like a real person mid-set: sweat sheen where natural, veins and muscle tone believable.",
        "If a face is visible, keep identity stable (no beautification, no reshaping bone structure).",
      ].join("\n");
    }
    return [
      "SUBJECT & CONTINUITY:",
      "If a person appears, preserve natural proportions; no beauty-filter smoothing or reshaping.",
      "Skin texture, fabric weave, and reflections must stay photographic, not illustrated.",
    ].join("\n");
  }

  function vehicleBlock(ctx, ideaLine) {
    if (!ctx.hasCar) return "";
    const city = ctx.city ? ` Use environment cues consistent with ${ctx.city} if visible.` : "";
    return [
      "",
      "VEHICLE & COCKPIT ACCURACY:",
      `Scene inspired by: "${ideaLine}".`,
      "Specify believable supercar or sports-car interior/exterior details: carbon fiber trim alignment, stitch direction,",
      "authentic dashboard layout, correct steering wheel geometry, and realistic glass reflections.",
      "No floating logos or impossible panel gaps; tires and brake hardware should match the car class." + city,
    ].join("\n");
  }

  function environmentBlock(ctx) {
    const place = ctx.city
      ? `${ctx.city} skyline or street ambience where appropriate — neon, glass towers, warm tungsten mixed with cool LED.`
      : "Urban night ambience with mixed color temperatures — cool LED spill, warm street lamps, realistic bloom, not fantasy.";
    return [
      "",
      "ENVIRONMENT & LIGHT:",
      place,
      "Light should feel sourced from the scene: reflections on paint, windshield, and dash must match visible sources.",
      "Subtle atmospheric haze acceptable; avoid heavy fog unless the idea implies it.",
    ].join("\n");
  }

  function buildPrompt(raw, aspect, cameraKind) {
    const ideaLine = raw.trim() || "a candid real-world scene";
    const tokens = normalizeTokens(ideaLine);
    const ctx = detectContext(tokens);
    const cam = cameraPhrase(cameraKind);

    const parts = [
      "ABSURDISM — REALISTIC HANDHELD PHOTO PROMPT",
      "",
      `SCENE IDEA (anchor all details to this): "${ideaLine}"`,
      "",
      "OUTPUT INTENT:",
      "Generate a single photorealistic image that looks like a spontaneous phone snapshot, not a studio render or illustration.",
      "",
      "TECHNICAL PHOTOGRAPHY:",
      `Aspect ratio: ${aspect} (compose for this frame; do not letterbox unless the platform requires).`,
      cam,
      "Visible sensor grain at moderate ISO, mild exposure imbalance between highlights and shadows (believable, not HDR-crushed).",
      "Slight motion micro-blur permissible on edges if it sells handheld authenticity.",
      "",
      "COMPOSITION & PERSPECTIVE:",
      ctx.hasCar
        ? [
            "Prefer a driver's or passenger's POV when it fits the idea — phone held near eye or chest height.",
            "Windshield and dash occupy foreground; world reads through glass with natural double reflections.",
            "Keep horizon plausible; avoid ultra-wide distortion unless it matches a real phone ultrawide lens.",
          ].join("\n")
        : [
            "Eye-level or slightly high phone angle; avoid symmetrical product-hero framing unless the idea is explicitly static.",
            "Foreground element optional (hand, strap, fabric) to sell proximity and scale.",
          ].join("\n"),
      "",
      subjectBlock(ctx),
      vehicleBlock(ctx, ideaLine),
      environmentBlock(ctx),
      "",
      "MOOD:",
      "The scene feels spontaneous and casually captured — imperfect in the way real photos are, still premium and believable.",
      "",
      "NEGATIVE (avoid):",
      "cartoon, CGI sheen, oversharpened HDR, beauty filters, plastic skin, fake bokeh, text overlays, watermarks, extra fingers,",
      "distorted logos, impossible anatomy, studio cyclorama, symmetrical catalog lighting.",
    ];

    return parts.filter((p) => p !== "").join("\n");
  }

  function setLoading(on) {
    el.outputWrap.classList.toggle("is-loading", on);
    el.generate.classList.toggle("is-loading", on);
    el.generate.disabled = on;
    el.idea.disabled = on;
    el.aspect.disabled = on;
    el.camera.disabled = on;
    el.output.setAttribute("aria-busy", on ? "true" : "false");
    el.copy.disabled = on || !el.output.textContent.trim();
    if (on) {
      el.output.textContent = "";
      el.output.classList.remove("output--flash");
    }
  }

  function renderImmediate() {
    const text = buildPrompt(el.idea.value, el.aspect.value, el.camera.value);
    el.output.textContent = text;
    el.copy.disabled = !text.trim();
    el.output.classList.remove("output--flash");
    void el.output.offsetWidth;
    el.output.classList.add("output--flash");
    el.output.addEventListener(
      "animationend",
      () => {
        el.output.classList.remove("output--flash");
      },
      { once: true }
    );
  }

  function generateWithLoading() {
    setLoading(true);
    el.status.textContent = "Composing your prompt…";
    window.setTimeout(() => {
      renderImmediate();
      setLoading(false);
      el.status.textContent = el.idea.value.trim()
        ? ""
        : "Using a generic anchor — add your scene idea for a tailored prompt.";
    }, LOADING_MS);
  }

  el.generate.addEventListener("click", () => {
    generateWithLoading();
  });

  el.idea.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      generateWithLoading();
    }
  });

  el.aspect.addEventListener("change", () => {
    if (el.output.textContent && !el.outputWrap.classList.contains("is-loading")) {
      renderImmediate();
    }
  });

  el.camera.addEventListener("change", () => {
    if (el.output.textContent && !el.outputWrap.classList.contains("is-loading")) {
      renderImmediate();
    }
  });

  el.copy.addEventListener("click", async () => {
    const t = el.output.textContent;
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      el.status.textContent = "Copied to clipboard.";
    } catch {
      el.status.textContent = "Copy failed — select the text and copy manually.";
    }
  });
})();
