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
    const hasCar =
      tokens.some((t) => CAR_BRANDS.has(t)) ||
      /\b(car|drive|highway|supercar|hypercar|road|jesko|vehicle)\b/i.test(joined);
    const hasWatch = tokens.some((t) => WATCH_HINTS.has(t));
    const hasGym = tokens.some((t) => GYM_HINTS.has(t));
    let city = null;
    for (const t of tokens) {
      if (CITY_HINTS[t]) {
        city = CITY_HINTS[t];
        break;
      }
    }
    const hasNight = /\b(night|nighttime|midnight|evening|dusk|nocturnal|neon|streetlight|after\s*dark)\b/i.test(joined);
    const hasWater = /\b(water|ocean|sea|bay|beach|pool|jetski|jet\s*ski|yacht|boat|marine|harbor|harbour|ripples?)\b/i.test(
      joined
    );
    const hasPortraitCue = /\b(portrait|face|subject|person|model|character|shirtless|man|woman|leaning)\b/i.test(joined);
    let angleNote = null;
    if (/\b(high\s*angle|from\s*above|top\s*down|aerial|overhead)\b/i.test(joined)) {
      angleNote = "high angle looking down — camera above eye line, cinematic downward perspective.";
    } else if (/\b(low\s*angle|from\s*below|worm|hero\s*angle|upward)\b/i.test(joined)) {
      angleNote = "low angle looking up — dramatic upward perspective, believable lens distortion only if natural.";
    }

    return { hasCar, hasWatch, hasGym, city, hasNight, hasWater, hasPortraitCue, angleNote };
  }

  function technicalBlock(cameraKind, aspect) {
    const base = [
      `Aspect ratio: ${aspect} — compose for this frame; do not add fake letterboxing unless the host app requires it.`,
    ];

    if (cameraKind === "compact") {
      base.push(
        "Cinematic DSLR / mirrorless look: full-frame sensor character, e.g. Canon EOS R5 class; 85mm lens f/1.4 where a portrait look fits the idea, otherwise 35mm or 50mm as appropriate.",
        "ISO 400–800 range feel, fine grain, natural highlight roll-off; 8K-level fine detail without plastic oversharpening or fake 'AI enhance' crunch.",
        "Shallow depth of field only where motivated; background bokeh must look optical, not painted."
      );
    } else if (cameraKind === "android") {
      base.push(
        "Flagship Android smartphone capture: realistic computational HDR, natural color science, mild lens vignette, believable JPEG texture.",
        "Visible moderate ISO grain in shadows; no DSLR CGI look."
      );
    } else {
      base.push(
        "Latest iPhone Pro / Pro Max tier (or equivalent flagship): handheld, realistic smartphone HDR, natural sharpening, authentic lens flare behavior.",
        "Sensor grain in darker regions; exposure choices should feel like a real phone in the described lighting, not a studio render."
      );
    }

    base.push(
      "Keep highlight and shadow separation believable — not HDR-crushed, not flat log.",
      "Slight motion micro-blur on edges acceptable if it sells a candid capture."
    );

    return ["TECHNICAL CAPTURE:", ...base].join("\n");
  }

  function compositionBlock(ctx) {
    const lines = [
      "COMPOSITION & CINEMATIC FRAMING:",
      "Build a deliberate, slightly unbalanced frame when it suits the idea — avoid default dead-center product symmetry unless the scene calls for it.",
      "Foreground / midground / background hierarchy: let one layer dominate (Subject, vehicle, or skyline) and let supporting elements recede with atmospheric depth.",
    ];
    if (ctx.angleNote) {
      lines.push(ctx.angleNote);
    } else if (ctx.hasCar) {
      lines.push(
        "When inside a car: driver's or passenger POV works — windshield and dash as foreground planes, world readable through glass with double reflections and correct parallax.",
        "When outside with a car: show believable stance — leaning on bodywork, standing beside, or three-quarter automotive hero angle; match realistic focal length perspective."
      );
    } else {
      lines.push(
        "Place the Subject with intent — slightly off-center, rule-of-thirds, or environmental framing (architecture, water line, leading rails) so the image feels directed, not accidental.",
        "Optional foreground occlusion (hands, fabric, vehicle edge, spray) to increase depth and scale."
      );
    }
    lines.push("Horizon and verticals should stay plausible; avoid fisheye unless the idea implies ultrawide phone lens.");
    return lines.join("\n");
  }

  function referenceAndSubjectBlock(ctx) {
    const lines = [
      "REFERENCE IMAGE & SUBJECT FIDELITY (when your app accepts an image + prompt):",
      "If a reference face/body upload exists: the Subject must remain visually identical to that reference — same facial structure, proportions, skin tone, and distinguishing marks.",
      "Do not beautify, de-age, slim, or reshape the face or skull; no symmetry-forcing 'perfect' features. The Subject's face must match the reference as closely as the model allows.",
      "Describe people as \"the Subject\" — wardrobe, jewelry, skin sheen, wet hair, and accessories must follow the idea and stay physically plausible.",
      "Skin: natural texture with visible pores and micro-contrast where light hits; clear healthy skin without fake plastic blur unless the idea explicitly calls for heavy makeup.",
      "Clothing and materials: resolve fine weave, stitching, metal, glass, water, and paint at a believable macro level.",
    ];
    if (ctx.hasWatch && !ctx.hasCar) {
      lines.push(
        "Watch focus: metal brushing, sapphire glare, bezel numerals, and strap texture must be optically correct under scene lighting."
      );
    }
    if (ctx.hasGym) {
      lines.push(
        "Athletic context: sweat sheen, muscle tone, and veins where appropriate; no exaggerated anatomy."
      );
    }
    return lines.join("\n");
  }

  function vehicleBlock(ctx, ideaLine) {
    if (!ctx.hasCar) return "";
    const city = ctx.city ? ` Environmental cues may echo ${ctx.city} if the idea implies that setting.` : "";
    return [
      "",
      "VEHICLE & PROPS:",
      `Expand this idea faithfully: "${ideaLine}".`,
      "Nameplates and body lines must match the implied marque (e.g. hypercar proportions, active aero, carbon weave direction, panel gaps, brake hardware).",
      "Paint: correct specular response and orange-peel subtlety; glass: realistic tint and double reflections; interior: believable stitching and trim alignment if visible." + city,
    ].join("\n");
  }

  function environmentBlock(ctx) {
    const lines = [
      "",
      "ENVIRONMENT, LIGHT & ATMOSPHERE:",
    ];
    if (ctx.hasWater && ctx.hasNight) {
      lines.push(
        "Night on or near water: dark reflective surface with specular city or vessel lights; subtle ripples, spray, or droplets if the idea includes motion; humid air and soft atmospheric haze over distance.",
        "Marine traffic, distant wakes, or moored craft may add scale — keep lettering on hulls plausible if visible, or omit unreadable text."
      );
    } else if (ctx.hasWater) {
      lines.push(
        "Water scene: reflections, caustics where appropriate, spray or surface tension detail; balance cool ambient with warm highlights."
      );
    } else if (ctx.hasNight) {
      lines.push(
        "Night exterior: mixed color temperatures — sodium, LED, neon, moon spill; specular highlights on wet surfaces, paint, and skin; bokeh from distant sources where depth allows.",
        "Streetlight pools and falloff; avoid flat uniform blue night."
      );
    } else if (ctx.city) {
      lines.push(
        `${ctx.city}-appropriate architecture, signage scale, and ambient light color — not a generic skyline paste.`,
        "Atmospheric perspective: haze or smog at distance where realistic."
      );
    } else {
      lines.push(
        "Light must read as motivated by real sources in frame; reflections and shadow direction stay consistent.",
        "Optional gentle atmospheric haze or dust in air for depth — not heavy fantasy fog unless specified."
      );
    }
    lines.push(
      "Specular highlights on metal, glass, water, and skin must match visible light sources; no random star filters unless the lens would produce them."
    );
    return lines.join("\n");
  }

  function microDetailsBlock(ctx) {
    const lines = [
      "",
      "MICRO-DETAILS (weave in several believable specifics tied to the idea):",
      "— Tiny speculars: edge highlights on wet hair, jewelry glints, droplets frozen mid-air, rail or hull polish, dashboard glass flecks.",
      "— Environmental crumbs: distant navigation lights, faint haze bands, subtle shadow gradients across skin or vehicle panels, micro-ripples, tire contact patches.",
      "— Texture fidelity: fabric fiber, carbon weave, brushed metal grain, salt or moisture on surfaces where appropriate.",
    ];
    if (ctx.hasCar) {
      lines.push("— Automotive: correct badge legibility at distance, tire sidewall text where readable, brake glow only if braking is implied.");
    }
    return lines.join("\n");
  }

  function openingHook(ideaLine, ctx) {
    const time = ctx.hasNight ? "nighttime" : "the described lighting";
    const vibe = ctx.hasWater && ctx.hasNight ? "humid, reflective, and electrically lit" : "cinematic and spatially readable";
    const lines = [
      "PRIMARY SCENE (expand from the anchor below):",
      `Dramatic, hyper-realistic photograph inspired by: "${ideaLine}".`,
      `Compose for ${time} with intentional framing — foreground and background working together, ${vibe} atmosphere, and premium material read (skin, metal, glass, water, fabric).`,
      "The image should feel like a still from high-end lifestyle or automotive photography, not a stock composite.",
    ];
    if (ctx.hasPortraitCue) {
      lines.push(
        "Center the narrative on the Subject — pose, wardrobe, jewelry, and gaze should read clearly against the environment (e.g. skyline, vehicle, or water as a deliberate backdrop)."
      );
    }
    return lines.join("\n");
  }

  function buildPrompt(raw, aspect, cameraKind) {
    const ideaLine = raw.trim() || "a candid real-world luxury scene";
    const tokens = normalizeTokens(ideaLine);
    const ctx = detectContext(tokens);

    const chunks = [
      `SCENE ANCHOR (all details must follow this): "${ideaLine}"`,
      "",
      openingHook(ideaLine, ctx),
      "",
      "OUTPUT INTENT:",
      "Create one hyper-realistic photograph — natural, authentic, HD-level detail — not an illustration, not CGI sheen, not a beauty-filter portrait.",
      "",
      referenceAndSubjectBlock(ctx),
      "",
      technicalBlock(cameraKind, aspect),
      "",
      compositionBlock(ctx),
      "",
      vehicleBlock(ctx, ideaLine),
      environmentBlock(ctx),
      microDetailsBlock(ctx),
      "",
      "FINAL QUALITY BAR:",
      "Overall impression: HD, hyper-realistic, natural and authentic — consistent with the anchor idea, composition, wardrobe, and environment. If a reference image is used, the Subject must remain visually continuous with that upload.",
      "",
      "NEGATIVE (avoid):",
      "cartoon, CGI plastic skin, oversharpened HDR, beauty-filter smoothing, fake tan, invented facial features, wrong bone structure, extra or fused fingers,",
      "distorted logos, impossible anatomy, floating objects, random illegible text, stock sky replacement, symmetrical catalog lighting unless specified.",
    ];

    return chunks.filter((c) => c !== "").join("\n");
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
