(function cleanest() {
  if (!Spicetify?.Platform || !Spicetify?.Platform?.History?.listen) {
    setTimeout(cleanest, 100);
    return;
  }

  const defImage = "https://i.imgur.com/efnK6MN.png";
  let startImage = localStorage.getItem("cleanest:startupBg") || defImage;
  const toggleInfo = [
    {
      id: "UseCustomBackground",
      name: "Custom background",
      defVal: false,
      group: "theme",
    },
    {
      id: "UseCustomColor",
      name: "Custom color",
      defVal: false,
      group: "theme",
    },
    {
      id: "HideNowPlayingSidebar",
      name: "Hide now playing sidebar",
      defVal: false,
      group: "theme",
    },
    {
      id: "ExtendSidebars",
      name: "Scaleable bottom bar",
      defVal: false,
      group: "theme",
    },
    {
      id: "LikedHeartRecolor",
      name: "Custom \"Liked Songs\" art",
      defVal: true,
      group: "theme",
    },
    // Toggleable NPV sections — all default to hidden (true) to match what
    // was previously hardcoded off in user.css, so nothing changes visually
    // on first load; now it's just switchable instead of permanent.
    {
      id: "HideLyricsButton",
      name: "Lyrics button",
      defVal: true,
      group: "elements",
    },
    {
      id: "HideListeningActivity",
      name: "Listening activity",
      defVal: true,
      group: "elements",
    },
    {
      id: "HideCredits",
      name: "Credits",
      defVal: true,
      group: "elements",
    },
    {
      id: "HideMerch",
      name: "Merch",
      defVal: true,
      group: "elements",
    },
    {
      id: "HideAboutArtist",
      name: "About Artist",
      defVal: true,
      group: "elements",
    },
    {
      id: "HideOnTour",
      name: "On Tour",
      defVal: true,
      group: "elements",
    },
    {
      id: "HideSwitchToVideo",
      name: "Switch to video",
      defVal: true,
      group: "elements",
    },
    // These two weren't found hardcoded in your CSS (unlike the 7 above,
    // which I confirmed directly in your file) — best-effort selectors
    // based on the common aria-label wording, using case-insensitive
    // substring matches for a bit of resilience. Default to OFF (visible)
    // since I don't know if you actually want them hidden yet. Check
    // DevTools if a toggle doesn't do anything and send me the real
    // aria-label/class so I can fix the selector.
    {
      id: "HideMiniPlayer",
      name: "Mini player",
      defVal: false,
      group: "elements",
    },
    {
      id: "HideFullscreenButton",
      name: "Fullscreen button",
      defVal: false,
      group: "elements",
    },
    {
      id: "HideQueueButton",
      name: "Queue button",
      defVal: false,
      group: "elements",
    },
    {
      id: "HideConnectDevice",
      name: "Connect to a device",
      defVal: false,
      group: "elements",
    },
    {
      id: "HideWhatsNew",
      name: "What's New",
      defVal: false,
      group: "elements",
    },
    {
      id: "AmbienceEnabled",
      name: "Enable ambience glow",
      defVal: true,
      group: "ambience",
      master: true,
    },
    {
      id: "AmbienceReactive",
      name: "Animated Ambience",
      defVal: true,
      group: "ambience",
      animated: true,
    },
    {
      id: "AmbienceVideoSync",
      name: "Canvas video ambience",
      defVal: true,
      group: "ambience",
      animated: true,
      subgroup: "canvasvideo",
    },
    {
      id: "AmbienceVideoLeftOnly",
      name: "Left side only",
      defVal: false,
      group: "ambience",
      animated: true,
      subgroup: "canvasvideo",
    },
    {
      id: "EdgeGlowEnabled",
      name: "Enable screen edge glow",
      defVal: true,
      group: "edgeglow",
      master: true,
    },
    {
      id: "EdgeGlowTop",
      name: "Top strip",
      defVal: true,
      group: "edgeglow",
    },
    {
      id: "EdgeGlowLeft",
      name: "Left strip",
      defVal: true,
      group: "edgeglow",
    },
    {
      id: "EdgeGlowBottom",
      name: "Bottom strip",
      defVal: true,
      group: "edgeglow",
    },
    {
      id: "EdgeGlowReactive",
      name: "Animated edge glow",
      defVal: true,
      group: "edgeglow",
      animated: true,
    },
  ];

  // Single source of truth for the "advanced" shadow/decoration toggles —
  // used both to build ELEMENT_TOGGLES (persistence + initial body class,
  // in loadToggles() below) and to render the advanced modal's rows, so the
  // className can never drift out of sync between the two like a derived/
  // regex version could. Declared up here (not next to openAdvancedThemeModal
  // itself, further down) because loadToggles() — which reads this — runs
  // long before that point in the file.
  /* The native .main-trackCreditsModal-closeBtn kept rendering way outside
     the modal (confirmed via DevTools — its highlight box showed up over
     the mini-player area, nowhere near our header), almost certainly due
     to some Encore component CSS layer setting position: fixed/absolute
     on it that our rules can't out-specificity. Rather than keep chasing
     that, just hide it and drop in a plain button of our own inside the
     header — as a normal flex child it automatically lands next to the
     centered title with no positioning tricks needed. Polling briefly
     because PopupModal's content isn't necessarily attached to the
     document the instant display() returns. Takes the modal's aria-label
     so it works for any PopupModal we open, not just one hardcoded one. */
  function attachCleanestCloseBtn(modalAriaLabel, attempt = 0) {
    const header = document.querySelector(
      `div[aria-label="${modalAriaLabel}"] .main-trackCreditsModal-header`
    );
    const nativeClose = header?.querySelector(".main-trackCreditsModal-closeBtn");
    if (header && nativeClose) {
      nativeClose.style.setProperty("display", "none", "important");
      if (!header.querySelector(".cleanestCloseBtn")) {
        const closeBtn = document.createElement("button");
        closeBtn.className = "cleanestCloseBtn";
        closeBtn.type = "button";
        closeBtn.setAttribute("aria-label", "Close");
        closeBtn.innerHTML = "&#10005;";
        closeBtn.onclick = () => nativeClose.click();
        header.appendChild(closeBtn);
      }
      return;
    }
    if (attempt < 20) setTimeout(() => attachCleanestCloseBtn(modalAriaLabel, attempt + 1), 50);
  }

  // Shadow/decoration toggles. No settings UI exposes these anymore (in
  // either modal) — they're permanently fixed at their defVal below,
  // matching how they behaved before any toggle UI for them existed.
  // Still folded into ELEMENT_TOGGLES so the body classes get applied
  // consistently at startup, same mechanism as everything else, just
  // with no way to change the value from the UI.
  const SHADOW_TOGGLES = [
    { id: "ShowSidebarShadow", name: "Sidebar shadow", className: "__cleanest_show_sidebar_shadow" },
    { id: "ShowCardShadows", name: "Card shadows", className: "__cleanest_show_card_shadows" },
    // Unlike the others (which were previously hidden, off by default),
    // this text-shadow is currently always ON — so this one toggle defaults
    // to true, to match what's already live instead of changing it.
    { id: "ShowTrackTitleTextShadow", name: "Track title text shadow", className: "__cleanest_show_tracktitle_textshadow", defVal: true },
    { id: "ShowDjTint", name: "\"Up next\" DJ tint background", className: "__cleanest_show_dj_tint" },
    { id: "ShowChipBackground", name: "Filter chip background", className: "__cleanest_show_chip_background" },
    { id: "ShowRelatedVideosShelf", name: "Related music videos shelf", className: "__cleanest_show_related_videos" },
    { id: "ShowPlaylistButtonShadow", name: "Playlist/podcast button shadow", className: "__cleanest_show_playlistbutton_shadow" },
    { id: "ShowArtistHeaderShadow", name: "Artist header shadow", className: "__cleanest_show_artistheader_shadow" },
    { id: "ShowTrackListHeaderShadow", name: "Track list header shadow", className: "__cleanest_show_tracklistheader_shadow" },
    { id: "ShowTopBarFriendActivityShadow", name: "Top bar friend activity shadow", className: "__cleanest_show_topbar_friendactivity_shadow" },
    { id: "ShowLibraryRowImageShadow", name: "Library row image shadow", className: "__cleanest_show_libraryrow_shadow" },
    { id: "ShowHomeShortcutsShadow", name: "Home shortcut tiles shadow", className: "__cleanest_show_homeshortcuts_shadow" },
    { id: "ShowSidebarHeaderShadow", name: "Sidebar header shadow", className: "__cleanest_show_sidebarheader_shadow" },
  ];

  const ADVANCED_TOGGLES = [
    // Compatibility toggles — gate CSS/JS written specifically to smooth
    // over conflicts with other, separately-installed mods. Split into one
    // sub-toggle per individual tweak (not one master switch per mod), so
    // each can be turned off independently for finer control. All default
    // ON since the rules they gate were already unconditionally active
    // before these toggles existed.
    { id: "SpicyLyricsBgTint", name: "Neutralize background tint", className: "__cleanest_compat_spicylyrics_bgtint", defVal: true, category: "compat", mod: "Spicy Lyrics" },
    { id: "SpicyLyricsCardShadow", name: "Remove NPV card shadow", className: "__cleanest_compat_spicylyrics_cardshadow", defVal: true, category: "compat", mod: "Spicy Lyrics" },
    { id: "SpicyLyricsHideDynamicBg", name: "Hide Spicy Lyrics' own dynamic background", className: "__cleanest_compat_spicylyrics_hidedynamicbg", defVal: true, category: "compat", mod: "Spicy Lyrics" },
    { id: "WavelinkCoverSync", name: "Cover art sync", className: "__cleanest_compat_wavelink_cover", defVal: true, category: "compat", mod: "Wavelink" },
    { id: "WavelinkAccentSync", name: "Accent color sync", className: "__cleanest_compat_wavelink_accent", defVal: true, category: "compat", mod: "Wavelink" },
    { id: "WavelinkBackgroundSync", name: "Panel background sync", className: "__cleanest_compat_wavelink_bgsync", defVal: true, category: "compat", mod: "Wavelink" },
    { id: "WavelinkTopbarTransparent", name: "Transparent top bar", className: "__cleanest_compat_wavelink_topbar", defVal: true, category: "compat", mod: "Wavelink" },
  ];

  // Panel background color/opacity customization. Each panel's CSS rule
  // (in user.css) reads its own --cleanest-bg-* custom property with a
  // fallback matching its current hardcoded value, so nothing changes
  // visually until the user actually touches a control.
  const PANEL_BACKGROUNDS = [
    { id: "SidebarBg", name: "Right sidebar", cssVar: "--cleanest-bg-sidebar", defaultHex: "#0a0a0a", defaultAlpha: 0 },
    { id: "LibraryBg", name: "Library entry points", cssVar: "--cleanest-bg-library", defaultHex: "#000000", defaultAlpha: 0 },
    { id: "MainViewBg", name: "Main view", cssVar: "--cleanest-bg-mainview", defaultHex: "#000000", defaultAlpha: 0 },
    { id: "NowPlayingBarBg", name: "Now playing bar", cssVar: "--cleanest-bg-nowplayingbar", defaultHex: "#000000", defaultAlpha: 0 },
    { id: "GlobalNavBg", name: "Top nav bar", cssVar: "--cleanest-bg-globalnav", defaultHex: "#000000", defaultAlpha: 0 },
  ];

  function hexToRgba(hex, alphaPct) {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alphaPct / 100})`;
  }

  function applyPanelBackground(panel) {
    const hex = localStorage.getItem(`${panel.id}Color`) || panel.defaultHex;
    const storedAlpha = localStorage.getItem(`${panel.id}Alpha`);
    const alpha = storedAlpha === null ? panel.defaultAlpha : Number(storedAlpha);
    document.documentElement.style.setProperty(panel.cssVar, hexToRgba(hex, alpha));
  }

  function applyAllPanelBackgrounds() {
    PANEL_BACKGROUNDS.forEach(applyPanelBackground);
  }
  applyAllPanelBackgrounds();

  function openAdvancedThemeModal() {
    const content = document.createElement("div");
    content.classList.add("cleanestAdvancedModal");

    const note = document.createElement("p");
    note.classList.add("cleanestAdvancedNote");
    note.textContent =
      "These control compatibility tweaks for other mods. Changes apply immediately — no Apply/Save needed here.";
    content.append(note);

    const bgHeader = document.createElement("h3");
    bgHeader.classList.add("cleanestSectionHeader");
    bgHeader.textContent = "Panel backgrounds";
    content.append(bgHeader);

    for (const panel of PANEL_BACKGROUNDS) {
      const row = document.createElement("div");
      row.classList.add("cleanestOptionRow", "cleanestBgRow");
      row.setAttribute("name", panel.id);

      const label = document.createElement("span");
      label.classList.add("cleanestOptionDesc");
      label.textContent = `${panel.name}:`;

      const controls = document.createElement("span");
      controls.classList.add("cleanestBgControls");

      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.value = localStorage.getItem(`${panel.id}Color`) || panel.defaultHex;

      const alphaInput = document.createElement("input");
      alphaInput.type = "range";
      alphaInput.min = "0";
      alphaInput.max = "100";
      alphaInput.step = "1";
      const storedAlpha = localStorage.getItem(`${panel.id}Alpha`);
      alphaInput.value = storedAlpha === null ? panel.defaultAlpha : storedAlpha;

      const alphaValue = document.createElement("span");
      alphaValue.classList.add("cleanestBgAlphaValue");
      alphaValue.textContent = `${alphaInput.value}%`;

      const update = () => {
        localStorage.setItem(`${panel.id}Color`, colorInput.value);
        localStorage.setItem(`${panel.id}Alpha`, alphaInput.value);
        alphaValue.textContent = `${alphaInput.value}%`;
        applyPanelBackground(panel);
      };
      colorInput.addEventListener("input", update);
      alphaInput.addEventListener("input", update);

      controls.append(colorInput, alphaInput, alphaValue);
      row.append(label, controls);
      content.append(row);
    }

    const CATEGORY_HEADERS = {
      compat: "Compatibility",
    };

    let currentCategory = null;
    let currentMod = null;
    for (const { id, name, className, defVal, category, mod } of ADVANCED_TOGGLES) {
      if (category !== currentCategory) {
        currentCategory = category;
        currentMod = null;
        const sectionHeader = document.createElement("h3");
        sectionHeader.classList.add("cleanestSectionHeader");
        sectionHeader.textContent = CATEGORY_HEADERS[category] || category;
        content.append(sectionHeader);
      }
      if (mod && mod !== currentMod) {
        currentMod = mod;
        const modHeader = document.createElement("h4");
        modHeader.classList.add("cleanestSubHeader", "cleanestModHeader");
        modHeader.textContent = mod;
        content.append(modHeader);
      }
      const row = document.createElement("div");
      row.classList.add("cleanestOptionRow");
      row.setAttribute("name", id);
      row.innerHTML = `
      <span class="cleanestOptionDesc">${name}:</span>
      <button class="cleanestOptionToggle">
        <span class="toggleWrapper">
          <span class="toggle"></span>
        </span>
      </button>`;
      const stored = localStorage.getItem(id);
      const isEnabled = stored === null ? (defVal ?? false) : JSON.parse(stored);
      row.querySelector(".toggle").classList.toggle("enabled", isEnabled);
      row.querySelector("button").addEventListener("click", () => {
        const nowEnabled = !row.querySelector(".toggle").classList.contains("enabled");
        row.querySelector(".toggle").classList.toggle("enabled", nowEnabled);
        localStorage.setItem(id, JSON.stringify(nowEnabled));
        document.body.classList.toggle(className, nowEnabled);
      });
      content.append(row);
    }

    const resetRow = document.createElement("div");
    resetRow.classList.add("cleanestAdvancedResetRow");
    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.textContent = "Reset advanced settings";
    resetButton.classList.add("cleanestAdvancedResetButton");
    resetButton.addEventListener("click", () => {
      // Clear every key this modal owns, then re-apply defaults and
      // re-render in place — simpler and less error-prone than trying to
      // reset each input's value/UI state by hand one at a time.
      for (const { id } of ADVANCED_TOGGLES) {
        localStorage.removeItem(id);
      }
      for (const panel of PANEL_BACKGROUNDS) {
        localStorage.removeItem(`${panel.id}Color`);
        localStorage.removeItem(`${panel.id}Alpha`);
      }
      loadToggles();
      applyAllPanelBackgrounds();
      Spicetify.PopupModal.hide();
      setTimeout(() => openAdvancedThemeModal(), 0);
    });
    resetRow.append(resetButton);
    content.append(resetRow);

    Spicetify.PopupModal.display({ title: "Advanced Theme Settings", content });
    attachCleanestCloseBtn("Advanced Theme Settings");
  }

  const toggles = {
    UseCustomBackground: false,
    UseCustomColor: false,
    HideNowPlayingSidebar: false,
    ExtendSidebars: false,
    HideLyricsButton: true,
    HideListeningActivity: true,
    HideCredits: true,
    HideMerch: true,
    HideAboutArtist: true,
    HideOnTour: true,
    HideSwitchToVideo: true,
    HideMiniPlayer: false,
    HideFullscreenButton: false,
    HideQueueButton: false,
    HideConnectDevice: false,
    HideWhatsNew: false,
    AmbienceEnabled: true,
    AmbienceReactive: true,
    EdgeGlowEnabled: true,
    EdgeGlowTop: true,
    EdgeGlowLeft: true,
    EdgeGlowBottom: true,
    EdgeGlowReactive: true
  };
  const sliders = [
    {
      id: "blur",
      name: "Blur",
      min: 0,
      max: 50,
      step: 1,
      defVal: 15,
      end: "px",
      group: "theme",
    },
    { id: "cont", name: "Contrast", min: 0, max: 200, step: 2, defVal: 50, group: "theme" },
    { id: "satu", name: "Saturation", min: 0, max: 200, step: 2, defVal: 70, group: "theme" },
    {
      id: "bright",
      name: "Brightness",
      min: 0,
      max: 200,
      step: 2,
      defVal: 120,
      group: "theme",
    },
    // Ambience glow (Now Playing View) — ids match the CSS custom property
    // names used further down (--npv-ambience-spread / --npv-ambience-blur),
    // so loadSliders()/saveButton/resetButton handle them automatically
    // without any extra wiring.
    {
      id: "npv-ambience-spread",
      name: "Ambience Spread",
      min: 0,
      max: 50,
      step: 1,
      defVal: 10,
      end: "px",
      group: "ambience",
    },
    {
      id: "npv-ambience-blur",
      name: "Ambience Blur",
      min: 0,
      max: 50,
      step: 1,
      defVal: 15,
      end: "px",
      group: "ambience",
    },
    {
      id: "npv-ambience-static-brightness",
      name: "Static Brightness",
      min: 20,
      max: 400,
      step: 10,
      defVal: 100,
      group: "ambience",
    },
    {
      id: "npv-ambience-reactive-min",
      name: "Min Brightness",
      min: 20,
      max: 100,
      step: 5,
      defVal: 70,
      group: "ambience",
      animated: true,
    },
    {
      id: "npv-ambience-reactive-max",
      name: "Max Brightness",
      min: 100,
      max: 300,
      step: 5,
      defVal: 125,
      group: "ambience",
      animated: true,
    },
    {
      id: "npv-ambience-reactive-size-max",
      name: "Bass Size Boost",
      min: 100,
      max: 400,
      step: 10,
      defVal: 250,
      group: "ambience",
      animated: true,
    },
    {
      id: "npv-ambience-reactive-smoothing",
      name: "Reactive Smoothness",
      min: 5,
      max: 100,
      step: 5,
      defVal: 25,
      group: "ambience",
      animated: true,
    },
    {
      id: "npv-edge-glow-size",
      name: "Edge Glow Size",
      min: 20,
      max: 300,
      step: 10,
      defVal: 100,
      end: "px",
      group: "edgeglow",
    },
    {
      id: "npv-edge-glow-blur",
      name: "Edge Glow Blur",
      min: 0,
      max: 100,
      step: 5,
      defVal: 40,
      end: "px",
      group: "edgeglow",
    },
    {
      id: "npv-edge-glow-opacity",
      name: "Edge Glow Opacity",
      min: 5,
      max: 100,
      step: 5,
      defVal: 30,
      group: "edgeglow",
    },
    {
      id: "npv-edge-glow-reactive-boost",
      name: "Edge Glow Reactive Boost",
      min: 100,
      max: 400,
      step: 10,
      defVal: 200,
      group: "edgeglow",
      animated: true,
    },
  ];

  (function sidebar() {
    if (localStorage.getItem("Cleanest Sidebar Activated")) return;
    // Sidebar settings
    const parsedObject = JSON.parse(
      localStorage.getItem("spicetify-exp-features")
    );

    // Variable if client needs to reload
    let reload = false;

    // Array of features
    const features = [
      "enableYLXSidebar",
      "enableRightSidebar",
      "enableRightSidebarTransitionAnimations",
      "enableRightSidebarLyrics",
      "enableRightSidebarExtractedColors",
      "enablePanelSizeCoordination",
    ];

    for (const feature of features) {
      // Ignore if feature not present
      if (!parsedObject?.[feature]) continue;

      // Change value if disabled
      if (!parsedObject?.[feature]?.value) {
        parsedObject[feature].value = true;
        reload = true;
      }
    }

    localStorage.setItem(
      "spicetify-exp-features",
      JSON.stringify(parsedObject)
    );
    localStorage.setItem("Cleanest Sidebar Activated", true);
    if (reload) {
      window.location.reload();
      reload = false;
    }
  })();

  function loadSliders() {
    sliders.forEach((opt) => {
      const val = localStorage.getItem(`${opt.id}Amount`) || opt.defVal;
      document.documentElement.style.setProperty(
        `--${opt.id}`,
        `${val}${opt.end || "%"}`
      );
    });
  }

  function setAccentColor(color) {
    document.querySelector(":root").style.setProperty("--spice-button", color);
    document
      .querySelector(":root")
      .style.setProperty("--spice-button-active", color);
    document.querySelector(":root").style.setProperty("--spice-accent", color);
  }

  async function fetchFadeTime() {
    try {
      const response = await Spicetify.Platform.PlayerAPI._prefs.get({
        key: "audio.crossfade_v2",
      });

      // Default to 0.4s if crossfade is disabled
      if (!response.entries["audio.crossfade_v2"].bool) {
        document.documentElement.style.setProperty("--fade-time", "0.4s");
        return;
      }
      const fadeTimeResponse = await Spicetify.Platform.PlayerAPI._prefs.get({
        key: "audio.crossfade.time_v2",
      });
      const fadeTime =
        fadeTimeResponse.entries["audio.crossfade.time_v2"].number;

      // Use the CSS variable "--fade-time" for transition time
      document.documentElement.style.setProperty(
        "--fade-time",
        `${fadeTime / 1000}s`
      );
    } catch (error) {
      document.documentElement.style.setProperty("--fade-time", "0.4s");
    }
  }

  function getCurrentBackground(replace) {
    let url = Spicetify?.Player?.data?.item?.metadata?.image_url;
    if (toggles.UseCustomBackground || !url || !URL.canParse(url)) return startImage;
    if (replace)
      url = url.replace("spotify:image:", "https://i.scdn.co/image/");
    return url;
  }

  async function onSongChange() {
    fetchFadeTime();

    const album_uri = Spicetify?.Player?.data?.item?.metadata?.album_uri;
    if (album_uri !== undefined && !album_uri.includes("spotify:show")) {
      // Album
    } else if (Spicetify?.Player?.data?.item?.uri?.includes("spotify:episode")) {
      // Podcast
    } else if (Spicetify?.Player?.data?.item?.isLocal) {
      // Local file
    } else if (Spicetify?.Player?.data?.item?.provider === "ad") {
      // Ad
      return;
    } else {
      // When clicking a song from the homepage, songChange is fired with half empty metadata
      setTimeout(onSongChange, 200);
    }

    updateLyricsPageProperties();

    // Custom code added by lily
    if (!toggles.UseCustomColor) {
      // Get the accent color from the background image
      const img = new Image();
      // Allows CORS-enabled images
      img.crossOrigin = "Anonymous";

      img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        ).data;

        const rgbList = [];
        // Note that we are looping every 4 (red, green, blue and alpha)
        for (let i = 0; i < imageData.length; i += 4)
          rgbList.push({
            r: imageData[i],
            g: imageData[i + 1],
            b: imageData[i + 2],
          });

        // Attempt with filters
        let hexColor = findColor(rgbList);

        // Retry without filters if no color is found
        if (!hexColor) hexColor = findColor(rgbList, true);

        setAccentColor(hexColor);
      };

      // Always derived from the actual currently-playing track's own cover
      // (same as the right-hand Now Playing panel) — NOT getCurrentBackground(),
      // which instead reflects whatever's set as the background overlay and
      // switches to a fixed custom image when "Custom background" is on.
      // Using that here meant the accent color used to jump to match the
      // custom background image instead of following the playing track.
      const trackImageUrl = Spicetify?.Player?.data?.item?.metadata?.image_url;
      img.src = trackImageUrl
        ? trackImageUrl.replace("spotify:image:", "https://i.scdn.co/image/")
        : startImage;
    } else {
      setAccentColor(localStorage.getItem("CustomColor") || "#ffc0ea");
    }

    // Update background
    document.documentElement.style.setProperty(
      "--image_url",
      `url("${getCurrentBackground(false)}")`
    );
  }

  // Gets the most prominent color in a list of RGB values
  function findColor(rgbList, skipFilters = false) {
    const colorCount = {};
    let maxColor = "";
    let maxCount = 0;

    for (let i = 0; i < rgbList.length; i++) {
      if (
        !skipFilters &&
        (isTooDark(rgbList[i]) || isTooCloseToWhite(rgbList[i]))
      ) {
        continue;
      }

      const color = `${rgbList[i].r},${rgbList[i].g},${rgbList[i].b}`;
      colorCount[color] = (colorCount[color] || 0) + 1;

      if (colorCount[color] > maxCount) {
        maxColor = color;
        maxCount = colorCount[color];
      }
    }

    return maxColor ? rgbToHex(...maxColor.split(",").map(Number)) : null;
  }

  // Converts RGB to Hex
  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  }

  // Checks if a color is too dark
  function isTooDark(rgb) {
    const brightness = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    // Adjust this value to control the "darkness" threshold
    const threshold = 100;
    return brightness < threshold;
  }

  // Checks if a color is too close to white
  function isTooCloseToWhite(rgb) {
    const threshold = 200;
    return rgb.r > threshold && rgb.g > threshold && rgb.b > threshold;
  }

  loadSliders();
  loadToggles();
  Spicetify.Player.addEventListener("songchange", onSongChange);
  if (window.navigator.userAgent.indexOf("Win") !== -1)
    document.body.classList.add("windows");
  galaxyFade();

  function scrollToTop() {
    const element = document.querySelector(".main-entityHeader-container");
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest(".main-entityHeader-topbarTitle")) scrollToTop();
  });

  // Window Zoom Variable
  function updateZoomVariable() {
    let prevOuterWidth = window.outerWidth;
    let prevInnerWidth = window.innerWidth;
    let prevRatio = window.devicePixelRatio;

    function calculateAndApplyZoom() {
      const newOuterWidth = window.outerWidth;
      const newInnerWidth = window.innerWidth;
      const newRatio = window.devicePixelRatio;

      if (
        prevOuterWidth <= 160 ||
        prevRatio !== newRatio ||
        prevOuterWidth !== newOuterWidth ||
        prevInnerWidth !== newInnerWidth
      ) {
        const zoomFactor = newOuterWidth / newInnerWidth || 1;
        document.documentElement.style.setProperty("--zoom", zoomFactor);
        console.debug(
          `[Cleanest] Zoom Updated: ${newOuterWidth} / ${newInnerWidth} = ${zoomFactor}`
        );

        // Update previous values
        prevOuterWidth = newOuterWidth;
        prevInnerWidth = newInnerWidth;
        prevRatio = newRatio;
      }
    }

    calculateAndApplyZoom();
    window.addEventListener("resize", calculateAndApplyZoom);
  }

  updateZoomVariable();

  function waitForElement(elements, func, timeout = 100) {
    const queries = elements.map((element) => document.querySelector(element));
    if (queries.every((a) => a)) {
      func(queries);
    } else if (timeout > 0) {
      setTimeout(waitForElement, 300, elements, func, timeout - 1);
    }
  }

  waitForElement(
    [".Root__globalNav"],
    (element) => {
      const isCenteredGlobalNav = Spicetify.Platform.version >= "1.2.46.462";
      let addedClass = "control-nav";
      if (element?.[0]?.classList.contains("Root__globalNav"))
        addedClass = isCenteredGlobalNav ? "global-nav-centered" : "global-nav";
      document.body.classList.add(addedClass);
    },
    10000
  );

  Spicetify.Platform.History.listen(updateLyricsPageProperties);

  waitForElement([".Root__lyrics-cinema"], ([lyricsCinema]) => {
    const lyricsCinemaObserver = new MutationObserver(
      updateLyricsPageProperties
    );
    const lyricsCinemaObserverConfig = {
      attributes: true,
      attributeFilter: ["class"],
    };
    lyricsCinemaObserver.observe(lyricsCinema, lyricsCinemaObserverConfig);
  });

  waitForElement([".main-view-container"], ([mainViewContainer]) => {
    const mainViewContainerResizeObserver = new ResizeObserver(
      updateLyricsPageProperties
    );
    mainViewContainerResizeObserver.observe(mainViewContainer);
  });

  // Fixes container shifting & active line clipping
  // Taken from Bloom | https://github.com/nimsandu/spicetify-bloom
  function updateLyricsPageProperties() {
    function setLyricsPageProperties() {
      function calculateLyricsMaxWidth(lyricsContentWrapper) {
        const lyricsContentContainer = lyricsContentWrapper.parentElement;
        const marginLeft = Number.parseInt(
          window.getComputedStyle(lyricsContentWrapper).marginLeft,
          10
        );
        const totalOffset = lyricsContentWrapper.offsetLeft + marginLeft;
        return Math.round(
          0.95 * (lyricsContentContainer.clientWidth - totalOffset)
        );
      }

      waitForElement(
        [".lyrics-lyrics-contentWrapper"],
        ([lyricsContentWrapper]) => {
          lyricsContentWrapper.style.maxWidth = "";
          lyricsContentWrapper.style.width = "";

          // 0, 1 - blank lines
          const lyric = document.querySelectorAll(
            ".lyrics-lyricsContent-lyric"
          )[2];
          if (lyric) {
            document.documentElement.style.setProperty(
              "--lyrics-text-direction",
              /[\u0591-\u07FF]/.test(lyric.innerText) ? "right" : "left"
            );
          }

          document.documentElement.style.setProperty(
            "--lyrics-active-max-width",
            `${calculateLyricsMaxWidth(lyricsContentWrapper)}px`
          );

          // Lock lyrics wrapper width
          const lyricsWrapperWidth =
            lyricsContentWrapper.getBoundingClientRect().width;
          lyricsContentWrapper.style.maxWidth = `${lyricsWrapperWidth}px`;
          lyricsContentWrapper.style.width = `${lyricsWrapperWidth}px`;
        }
      );
    }

    function lyricsCallback(mutationsList, lyricsObserver) {
      for (const mutation of mutationsList)
        for (addedNode of mutation.addedNodes)
          if (addedNode.classList?.contains("lyrics-lyricsContent-provider"))
            setLyricsPageProperties();
      lyricsObserver.disconnect;
    }

    waitForElement(
      [".lyrics-lyricsContent-provider"],
      ([lyricsContentProvider]) => {
        setLyricsPageProperties();
        const lyricsObserver = new MutationObserver(lyricsCallback);
        lyricsObserver.observe(lyricsContentProvider.parentElement, {
          childList: true,
        });
      }
    );
  }

  function setFadeDirection(scrollNode) {
    let fadeDirection = "full";
    if (scrollNode.scrollTop === 0) {
      fadeDirection = "bottom";
    } else if (
      scrollNode.scrollHeight -
        scrollNode.scrollTop -
        scrollNode.clientHeight ===
      0
    ) {
      fadeDirection = "top";
    }
    scrollNode.setAttribute("fade", fadeDirection);
  }

  // Add fade and dimness effects to mainview and the artist image on scroll
  // Taken from Galaxy | https://github.com/harbassan/spicetify-galaxy/
  function galaxyFade() {
    const setupFade = (selector, onScrollCallback) => {
      waitForElement([selector], ([scrollNode]) => {
        let ticking = false;

        scrollNode.addEventListener("scroll", () => {
          if (!ticking) {
            window.requestAnimationFrame(() => {
              onScrollCallback(scrollNode);
              ticking = false;
            });
            ticking = true;
          }
        });

        // Initial trigger
        onScrollCallback(scrollNode);
      });
    };

    // Apply artist fade function
    const applyArtistFade = (scrollNode) => {
      const scrollValue = scrollNode.scrollTop;
      const fadeValue = Math.max(0, (-0.3 * scrollValue + 100) / 100);
      document.documentElement.style.setProperty("--artist-fade", fadeValue);
    };

    // Main view - apply artist fade + fade direction
    setupFade(
      ".Root__main-view [data-overlayscrollbars-viewport]",
      (scrollNode) => {
        applyArtistFade(scrollNode);
        setFadeDirection(scrollNode);
      }
    );

    // Nav bar - fade direction only
    setupFade(
      ".Root__nav-bar [data-overlayscrollbars-viewport]",
      (scrollNode) => {
        scrollNode.setAttribute("fade", "bottom");
        setFadeDirection(scrollNode);
      }
    );

    // Right sidebar - fade direction only
    setupFade(
      ".Root__right-sidebar [data-overlayscrollbars-viewport]",
      (scrollNode) => {
        scrollNode.setAttribute("fade", "bottom");
        setFadeDirection(scrollNode);
      }
    );
  }

  function loadToggles() {
    toggles.UseCustomBackground = JSON.parse(
      localStorage.getItem("UseCustomBackground")
    );
    toggles.UseCustomColor = JSON.parse(localStorage.getItem("UseCustomColor"));
    toggles.HideNowPlayingSidebar = JSON.parse(localStorage.getItem("HideNowPlayingSidebar"));

    // Toggleable NPV elements — each maps to a body class the CSS below
    // reads. All default to true (hidden), matching what used to be
    // permanently hardcoded off.
    const ELEMENT_TOGGLES = {
      HideLyricsButton: { className: "__cleanest_hide_lyrics", defVal: true },
      HideListeningActivity: { className: "__cleanest_hide_listeningactivity", defVal: true },
      HideCredits: { className: "__cleanest_hide_credits", defVal: true },
      HideMerch: { className: "__cleanest_hide_merch", defVal: true },
      HideAboutArtist: { className: "__cleanest_hide_aboutartist", defVal: true },
      HideOnTour: { className: "__cleanest_hide_ontour", defVal: true },
      HideSwitchToVideo: { className: "__cleanest_hide_switchtovideo", defVal: true },
      HideMiniPlayer: { className: "__cleanest_hide_miniplayer", defVal: false },
      HideFullscreenButton: { className: "__cleanest_hide_fullscreen", defVal: false },
      HideQueueButton: { className: "__cleanest_hide_queue", defVal: false },
      HideConnectDevice: { className: "__cleanest_hide_connectdevice", defVal: false },
      HideWhatsNew: { className: "__cleanest_hide_whatsnew", defVal: false },
      // Not a "hide" toggle like the rest — class is present when the
      // effect is ENABLED (default), so the user.css rules should be
      // scoped with `body.__cleanest_likedheart_recolor`, not `:not()`.
      LikedHeartRecolor: { className: "__cleanest_likedheart_recolor", defVal: true },
      // Live-updating ambience while Canvas video is showing (see
      // npvAmbience()'s isVideoMode handling) and its layout variant.
      AmbienceVideoSync: { className: "__cleanest_ambience_video_sync", defVal: true },
      AmbienceVideoLeftOnly: { className: "__cleanest_ambience_video_leftonly", defVal: false },

      // Generated from ADVANCED_TOGGLES/SHADOW_TOGGLES (defined further
      // down/above, same outer scope) rather than duplicated here by
      // hand — same className used by openAdvancedThemeModal()/the main
      // modal, so they can't drift out of sync.
      ...Object.fromEntries(
        ADVANCED_TOGGLES.map(({ id, className, defVal }) => [id, { className, defVal: defVal ?? false }])
      ),
      ...Object.fromEntries(
        SHADOW_TOGGLES.map(({ id, className, defVal }) => [id, { className, defVal: defVal ?? false }])
      ),
    };
    for (const [id, { className, defVal }] of Object.entries(ELEMENT_TOGGLES)) {
      const stored = localStorage.getItem(id);
      toggles[id] = stored === null ? defVal : JSON.parse(stored);
      document.body.classList.toggle(className, toggles[id]);
    }

    // Master switch — defaults to ON (matches prior behavior for anyone who
    // already has the glow configured). Turning this off disables the whole
    // ambience glow, static and animated alike.
    const storedEnabled = localStorage.getItem("AmbienceEnabled");
    toggles.AmbienceEnabled = storedEnabled === null ? true : JSON.parse(storedEnabled);
    document.documentElement.style.setProperty(
      "--npv-ambience-master-enabled",
      toggles.AmbienceEnabled ? 1 : 0
    );

    // AmbienceReactive defaults to ON (unlike the others, which default to
    // off), so a missing localStorage entry (first run) must resolve to true.
    const storedReactive = localStorage.getItem("AmbienceReactive");
    toggles.AmbienceReactive = storedReactive === null ? true : JSON.parse(storedReactive);
    // The ambience glow lives in a separate, self-contained script block (its
    // own IIFE) and can't see this `toggles` object directly, so the value is
    // mirrored onto a CSS custom property — which is plain DOM state and so
    // is readable from anywhere, regardless of which script block set it.
    document.documentElement.style.setProperty(
      "--npv-ambience-reactive-enabled",
      toggles.AmbienceReactive ? 1 : 0
    );

    const storedEdgeGlow = localStorage.getItem("EdgeGlowEnabled");
    toggles.EdgeGlowEnabled = storedEdgeGlow === null ? true : JSON.parse(storedEdgeGlow);
    document.documentElement.style.setProperty(
      "--npv-edge-glow-enabled",
      toggles.EdgeGlowEnabled ? 1 : 0
    );

    // Per-side visibility — each independently hides just that strip,
    // regardless of the others, on top of the master switch above.
    const EDGE_SIDE_TOGGLES = {
      EdgeGlowTop: "__cleanest_hide_edgeglow_top",
      EdgeGlowLeft: "__cleanest_hide_edgeglow_left",
      EdgeGlowBottom: "__cleanest_hide_edgeglow_bottom",
    };
    for (const [id, className] of Object.entries(EDGE_SIDE_TOGGLES)) {
      const stored = localStorage.getItem(id);
      toggles[id] = stored === null ? true : JSON.parse(stored);
      document.body.classList.toggle(className, !toggles[id]);
    }

    const storedEdgeReactive = localStorage.getItem("EdgeGlowReactive");
    toggles.EdgeGlowReactive = storedEdgeReactive === null ? true : JSON.parse(storedEdgeReactive);
    document.documentElement.style.setProperty(
      "--npv-edge-glow-reactive-enabled",
      toggles.EdgeGlowReactive ? 1 : 0
    );

    if (toggles.HideNowPlayingSidebar) {
      document.body.classList.add("__cleanest_hidenowplayingsidebar");
    }
    else {
      document.body.classList.remove("__cleanest_hidenowplayingsidebar");
    }

    const storedExtendSidebars = localStorage.getItem("ExtendSidebars");
    toggles.ExtendSidebars = storedExtendSidebars === null ? false : JSON.parse(storedExtendSidebars);
    document.body.classList.toggle("__cleanest_extend_sidebars", toggles.ExtendSidebars);

    // Skip when Wavelink currently owns playback — onSongChange() always
    // pulls from Spotify's OWN player state (Spicetify.Player.data),
    // which doesn't change while a Wavelink/SoundCloud track plays. Left
    // unguarded, clicking Apply would silently overwrite whatever accent
    // color Wavelink's own track set with the last real Spotify track's
    // color instead — and since the Wavelink accent-sync loop only
    // reacts to the cover URL actually changing, it wouldn't notice or
    // correct this on its own until the next real track change.
    if (!document.body.classList.contains("sc-active")) {
      onSongChange();
    }
  }

  // Input for custom background images (disabled until properly implemented)
  /* const bannerInput = document.createElement("input");
  bannerInput.type = "file";
  bannerInput.className = "banner-input";
  bannerInput.accept = [
    "image/jpeg",
    "image/apng",
    "image/avif",
    "image/gif",
    "image/png",
    "image/svg+xml",
    "image/webp",
  ].join(",");

  // When user selects a custom background image
  bannerInput.onchange = () => {
    if (!bannerInput.files.length) return;

    const file = bannerInput.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result;
      const [, , uid] = Spicetify.Platform.History.location.pathname.split("/");
      if (!uid) {
        try {
          localStorage.setItem("cleanest:startupBg", result);
        } catch {
          Spicetify.showNotification("File too large");
          return;
        }
        document.querySelector("#home-select img").src = result;
      }
    };
    reader.readAsDataURL(file);
  }; */

  // Create edit home topbar button
  const homeEdit = new Spicetify.Topbar.Button("Cleanest Settings", "edit", () => {
    const content = document.createElement("div");
    content.innerHTML = `
    <div class="main-playlistEditDetailsModal-albumCover" id="home-select">
      <div class="main-entityHeader-image" draggable="false">
        <img aria-hidden="false" draggable="false" loading="eager" class="main-image-image main-entityHeader-image main-entityHeader-shadow">
      </div>
      <div class="main-playlistEditDetailsModal-imageChangeButton">
        <div class="main-editImage-buttonContainer"></div>
      </div>
    </div>`;

    // Maps a settings group to the id of its master on/off toggle, so the
    // lock logic below works for any group (Ambience, Edge Glow, future
    // ones) instead of being hardcoded to just one.
    const GROUP_MASTERS = { ambience: "AmbienceEnabled", edgeglow: "EdgeGlowEnabled" };
    // Same idea, but for each group's own "reacts to music" sub-toggle —
    // "Animated" rows within a group need BOTH switches on, not just master.
    const GROUP_REACTIVE = { ambience: "AmbienceReactive", edgeglow: "EdgeGlowReactive" };

    function createToggle(opt, container = content) {
      let { id, name, defVal, group, master, animated } = opt;
      const toggleRow = document.createElement("div");
      toggleRow.classList.add("cleanestOptionRow");
      if (group) toggleRow.classList.add(`cleanest-group-${group}`);
      // "AmbienceVideoLeftOnly" is deliberately excluded here — it has its
      // own separate lock (updateCanvasVideoLock(), tied specifically to
      // "Canvas video ambience") rather than the general group one. It
      // used to get both: this class subjected it to updateSettingsLocks()
      // too, which re-unlocks every ambience-group "-dependent" row
      // whenever ANY of them fires (not just "Animated Ambience" — the
      // master "Enable ambience glow" alone was enough), stomping on
      // whatever updateCanvasVideoLock() had just set.
      if (group && !master && id !== "AmbienceVideoLeftOnly") toggleRow.classList.add(`cleanest-${group}-dependent`);
      // Note: "animated" is intentionally NOT applied here for toggles —
      // only to sliders (below). If the group's own "reacts to music"
      // toggle marked itself as animated, it would need itself to already
      // be on in order to be clickable — a permanent lockout the moment
      // it's off.
      toggleRow.innerHTML = `
      <span class="cleanestOptionDesc">${name}:</span>
      <button class="cleanestOptionToggle">
        <span class="toggleWrapper">
          <span class="toggle"></span>
        </span>
      </button>`;
      toggleRow.setAttribute("name", id);
      toggleRow
        .querySelector("button")
        .addEventListener("click", () => {
          toggleRow.querySelector(".toggle").classList.toggle("enabled");
          if (group in GROUP_MASTERS) updateSettingsLocks();
          if (id === "AmbienceVideoSync") updateCanvasVideoLock();
        });
      const isEnabled = JSON.parse(localStorage.getItem(id)) ?? defVal;
      toggleRow.querySelector(".toggle").classList.toggle("enabled", isEnabled);
      container.append(toggleRow);
    }

    function createSlider(opt, container = content) {
      let { id, name, min, max, step, defVal, end, group, animated } = opt;
      const val = localStorage.getItem(`${id}Amount`) || defVal;
      const slider = document.createElement("div");
      slider.classList.add("cleanestOptionRow");
      if (group) slider.classList.add(`cleanest-group-${group}`, `cleanest-${group}-dependent`);
      if (group && animated) slider.classList.add(`cleanest-${group}-animated`);
      slider.innerHTML = `
      <div class="slider-container">
        <label for="${id}-input">${name}:</label>
        <input class="slider" id="${id}-input" type="range" min="${min}" max="${max}" step="${step}" value="${val}">
        <div class="slider-value">
          <p id="${id}-value" contenteditable="true" >${val}${end || "%"}</p>
        </div>
      </div>`;
      slider.querySelector(`#${id}-value`).addEventListener("input", () => {
        let content = slider.querySelector(`#${id}-value`).textContent.trim();
        const number = Number.parseInt(content);
        if (content.length > 3) {
          // Truncate the content to 3 characters
          content = slider.querySelector(`#${id}-value`).textContent =
            content.slice(0, 3);
        }
        slider.querySelector(`#${id}-input`).value = number;
      });
      slider.querySelector(`#${id}-input`).addEventListener("input", () => {
        slider.querySelector(`#${id}-value`).textContent = `${
          slider.querySelector(`#${id}-input`).value
        }${opt.end || "%"}`;
      });
      container.append(slider);
    }

    function addSectionHeader(text, container = content) {
      const header = document.createElement("div");
      header.classList.add("cleanestSectionHeader");
      header.textContent = text;
      container.append(header);
    }

    function addSubHeader(text, container = content, group = "ambience") {
      const header = document.createElement("div");
      header.classList.add("cleanestSubHeader", `cleanest-${group}-dependent`);
      header.textContent = text;
      container.append(header);
    }

    // Greys out (and actually disables, not just visually) every setting
    // belonging to a group whose master switch is off — live as the
    // checkbox is clicked, before Apply is even hit. Works for any group
    // listed in GROUP_MASTERS, not just Ambience.
    function updateSettingsLocks() {
      for (const [group, masterId] of Object.entries(GROUP_MASTERS)) {
        const masterOn = content
          .querySelector(`.cleanestOptionRow[name="${masterId}"] .toggle`)
          ?.classList.contains("enabled");
        const reactiveId = GROUP_REACTIVE[group];
        const reactiveOn = reactiveId
          ? content.querySelector(`.cleanestOptionRow[name="${reactiveId}"] .toggle`)?.classList.contains("enabled")
          : true;

        content.querySelectorAll(`.cleanest-${group}-dependent`).forEach((row) => {
          // "Animated" rows within a group additionally need that group's
          // own "reacts to music" toggle on, not just the group's master.
          const isAnimated = row.classList.contains(`cleanest-${group}-animated`);
          const shouldEnable = isAnimated ? masterOn && reactiveOn : masterOn;
          // Just the one class toggle — it carries both pointer-events:none
          // (blocks interaction) and the greyed-out look via CSS. Also
          // setting the native `disabled`/contentEditable on every input
          // here was noticeably janky when many rows toggled at once.
          row.classList.toggle("cleanest-disabled", !shouldEnable);
        });
      }
    }

    // "Left side only" only makes sense alongside "Canvas video ambience"
    // itself — separate from the general group-master lock above since
    // this is a dependency on one specific sibling toggle, not the whole
    // group's master/reactive switches.
    function updateCanvasVideoLock() {
      const syncOn = content
        .querySelector('.cleanestOptionRow[name="AmbienceVideoSync"] .toggle')
        ?.classList.contains("enabled");
      const leftOnlyRow = content.querySelector('.cleanestOptionRow[name="AmbienceVideoLeftOnly"]');
      leftOnlyRow?.classList.toggle("cleanest-disabled", !syncOn);
    }

    const srcInput = document.createElement("input");
    srcInput.type = "text";
    srcInput.classList.add(
      "main-playlistEditDetailsModal-textElement",
      "main-playlistEditDetailsModal-titleInput"
    );
    srcInput.id = "src-input";
    srcInput.placeholder =
      "Background image URL";
    if (!startImage.startsWith("data:image")) {
      srcInput.value = startImage;
    }
    content.append(srcInput);

    const columnsWrapper = document.createElement("div");
    columnsWrapper.classList.add("cleanestSettingsColumns");
    const themeColumn = document.createElement("div");
    themeColumn.classList.add("cleanestSettingsColumn");
    const ambienceColumn = document.createElement("div");
    ambienceColumn.classList.add("cleanestSettingsColumn");
    const edgeGlowColumn = document.createElement("div");
    edgeGlowColumn.classList.add("cleanestSettingsColumn");
    const elementsColumn = document.createElement("div");
    elementsColumn.classList.add("cleanestSettingsColumn");

    addSectionHeader("Theme", themeColumn);
    toggleInfo
      .filter((opt) => opt.group === "theme")
      .forEach((opt) => createToggle(opt, themeColumn));

    // Additional settings (added by lily)
    const colorRow = document.createElement("div");
    colorRow.classList.add("cleanestOptionRow", "cleanest-group-theme");

    // Color label
    const colorLabel = document.createElement("label");
    colorLabel.id = "color-label";
    colorLabel.htmlFor = "color";
    colorLabel.textContent = "Color:";
    colorLabel.style.textAlign = "right";
    colorLabel.style.marginRight = "10px";
    colorLabel.style.fontSize = "0.875rem";
    colorRow.append(colorLabel);

    // Color picker
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.id = "color-input";
    colorInput.value = localStorage.getItem("CustomColor") || "#30bf63";
    colorInput.style.border = "none";
    colorRow.append(colorInput);
    themeColumn.append(colorRow);

    sliders
      .filter((opt) => opt.group === "theme")
      .forEach((opt) => createSlider(opt, themeColumn));

    const advancedButtonRow = document.createElement("div");
    advancedButtonRow.classList.add("cleanestOptionRow");
    const advancedButton = document.createElement("button");
    advancedButton.textContent = "Advanced theme settings";
    advancedButton.classList.add("cleanestAdvancedButton");
    advancedButton.type = "button";
    advancedButton.addEventListener("click", (e) => {
      // Without stopPropagation, this click also reaches whatever listener
      // closes the main modal on outside/backdrop clicks — that was closing
      // the main modal (expected) but also either preventing the second
      // PopupModal.display() from taking effect, or opening-then-immediately
      // -closing it, since PopupModal appears to be a single shared instance.
      // The setTimeout defers opening the second modal until after the
      // first one's own close has actually finished, instead of both
      // fighting over the same modal state in the same tick.
      e.stopPropagation();
      setTimeout(() => openAdvancedThemeModal(), 0);
    });
    advancedButtonRow.append(advancedButton);
    themeColumn.append(advancedButtonRow);

    addSectionHeader("Ambience Glow", ambienceColumn);
    // Master switch first, un-gated, so it's always usable.
    toggleInfo
      .filter((opt) => opt.master && opt.group === "ambience")
      .forEach((opt) => createToggle(opt, ambienceColumn));

    addSubHeader("Static", ambienceColumn, "ambience");
    sliders
      .filter((opt) => opt.group === "ambience" && !opt.animated)
      .forEach((opt) => createSlider(opt, ambienceColumn));

    addSubHeader("Animated", ambienceColumn, "ambience");
    toggleInfo
      .filter((opt) => opt.group === "ambience" && opt.animated && opt.subgroup !== "canvasvideo")
      .forEach((opt) => createToggle(opt, ambienceColumn));
    sliders
      .filter((opt) => opt.group === "ambience" && opt.animated && opt.subgroup !== "canvasvideo")
      .forEach((opt) => createSlider(opt, ambienceColumn));

    addSubHeader("Canvas video", ambienceColumn, "ambience");
    toggleInfo
      .filter((opt) => opt.group === "ambience" && opt.subgroup === "canvasvideo")
      .forEach((opt) => createToggle(opt, ambienceColumn));

    addSectionHeader("Edge Glow", edgeGlowColumn);
    // Color comes from the theme's own dynamic accent (var(--spice-accent)
    // — the same variable the liked-songs heart icon uses), not the cover
    // art, so there's no color-related setting here, just size/blur/opacity.
    toggleInfo
      .filter((opt) => opt.master && opt.group === "edgeglow")
      .forEach((opt) => createToggle(opt, edgeGlowColumn));
    toggleInfo
      .filter((opt) => opt.group === "edgeglow" && !opt.master && !opt.animated)
      .forEach((opt) => createToggle(opt, edgeGlowColumn));
    sliders
      .filter((opt) => opt.group === "edgeglow" && !opt.animated)
      .forEach((opt) => createSlider(opt, edgeGlowColumn));

    addSubHeader("Animated", edgeGlowColumn, "edgeglow");
    toggleInfo
      .filter((opt) => opt.group === "edgeglow" && opt.animated)
      .forEach((opt) => createToggle(opt, edgeGlowColumn));
    sliders
      .filter((opt) => opt.group === "edgeglow" && opt.animated)
      .forEach((opt) => createSlider(opt, edgeGlowColumn));

    addSectionHeader("Elements", elementsColumn);
    toggleInfo
      .filter((opt) => opt.group === "elements")
      .forEach((opt) => createToggle(opt, elementsColumn));

    columnsWrapper.append(themeColumn, ambienceColumn, edgeGlowColumn, elementsColumn);
    content.append(columnsWrapper);

    loadSliders();
    updateSettingsLocks();
    updateCanvasVideoLock();

    img = content.querySelector("img");
    img.src = localStorage.getItem("cleanest:startupBg") || defImage;

    srcInput.addEventListener("input", () => {
      img.src = srcInput.value
    })

    /* const editButton = content.querySelector(
      ".main-editImageButton-image.main-editImageButton-overlay"
    );
    editButton.onclick = () => {
      bannerInput.click();
    };
    const removeButton = content.querySelector(
      ".main-playlistEditDetailsModal-imageDropDownButton"
    );
    removeButton.onclick = () => {
      content.querySelector("img").src = defImage;
    }; */

    const buttonsRow = document.createElement("div");
    buttonsRow.style.display = "flex";
    buttonsRow.style.paddingTop = "15px";
    buttonsRow.style.alignItems = "flex-end";

    const resetButton = document.createElement("button");
    resetButton.id = "value-reset";
    resetButton.innerHTML = "Reset";

    const saveButton = document.createElement("button");
    saveButton.id = "home-save";
    saveButton.innerHTML = "Apply";

    saveButton.onclick = async () => {
      // Check if image background is valid
      let invalidImage = false;
      try {
        await fetch(srcInput.value, {
          "mode": "no-cors"
        });
      }
      catch (error) {
        invalidImage = true;
      }

      if (!srcInput.value || !URL.canParse(srcInput.value) || invalidImage) {
        saveButton.innerHTML = "Invalid image";
        saveButton.classList.add("applyfailed");
        saveButton.disabled = true;

        setTimeout(() => {
          saveButton.innerHTML = "Apply";
          saveButton.classList.remove("applyfailed");
          saveButton.disabled = false;
        }, 3000);

        return;
      }

      // Change the button text to "Applied!", add "applied" class, and disable the button
      saveButton.innerHTML = "Applied!";
      saveButton.classList.add("applied");
      saveButton.disabled = true;

      // Revert back to "Apply", remove "applied" class, and enable the button after a second
      setTimeout(() => {
        saveButton.innerHTML = "Apply";
        saveButton.classList.remove("applied");
        saveButton.disabled = false;
      }, 1000);

      // Update changed bg image
      startImage = srcInput.value || content.querySelector("img").src;
      localStorage.setItem("cleanest:startupBg", startImage);

      // Save the selected custom color (added by lily)
      localStorage.setItem(
        "CustomColor",
        document.getElementById("color-input").value
      );

      toggleInfo.forEach((opt) =>
        localStorage.setItem(
          opt.id,
          document
            .querySelector(`.cleanestOptionRow[name=${opt.id}] .toggle`)
            .classList.contains("enabled")
        )
      );
      sliders.forEach((opt) =>
        localStorage.setItem(
          opt.id + "Amount",
          document.querySelector(`.cleanestOptionRow #${opt.id}-input`).value
        )
      );

      loadSliders();
      loadToggles();
    };

    resetButton.onclick = () => {
      sliders.forEach((opt) => {
        document.querySelector(`.cleanestOptionRow #${opt.id}-input`).value =
          opt.defVal;
        document.querySelector(
          `.cleanestOptionRow #${opt.id}-value`
        ).textContent = `${opt.defVal}${opt.end || "%"}`;
      });
      toggleInfo.forEach((opt) => {
        document
          .querySelector(`.cleanestOptionRow[name=${opt.id}] .toggle`)
          .classList.toggle("enabled", opt.defVal);
      });
      document.getElementById("src-input").value = defImage;
      img.src = defImage;
      document.getElementById("color-input").value = "#30bf63";
    };

    const issueButton = document.createElement("a");
    issueButton.classList.add("issue-button");
    issueButton.innerHTML = "Report Issue";
    issueButton.href = "https://github.com/Alex-Scuf/Cleanest/issues";

    buttonsRow.append(issueButton, resetButton, saveButton);
    content.append(buttonsRow);

    Spicetify.PopupModal.display({ title: "Cleanest Settings", content });
    attachCleanestCloseBtn("Cleanest Settings");
  });
  homeEdit.element.classList.toggle("hidden", false);
})();





// NAME: NPV Ambience
// AUTHOR: OhItsTom (modified)
// DESCRIPTION: Adds a colorful glow behind the Now Playing View image.
//
// MODIFIED: glow is now centered on the cover art and grows symmetrically
// in every direction by a fixed, independently-configurable amount,
// instead of being stretched to the full cover width and stuck to a
// height that tracked the sidebar's panel width.
//
// To adjust the glow size, change the two values below:
const AMBIENCE_SPREAD_PX = 10;      // how far the glow extends beyond the cover art, in px (try 8-30)
const AMBIENCE_BLUR_PX = 15;        // blur amount, in px

// Reactive brightness ("volume visualizer"): pulses the glow using the
// track's own loudness curve — Spotify's per-segment audio analysis data
// (the same pre-computed data classic Spotify visualizers use) — replayed
// in sync with playback position. This is NOT live captured system audio:
// the actual decoded audio stream can't be tapped from JS (Spotify decrypts
// it through Widevine DRM), so there's no way to read real-time volume from
// the browser. This instead reads Spotify's own analysis of how loud the
// track is at the current position, which gives a genuinely music-reactive
// pulse (louder on beats/hits, dimmer in quiet parts) without needing that.
// Reactive brightness is now fully controlled by the "Ambience reacts to
// music loudness" toggle in the settings menu (see toggleInfo above) —
// these three are just the fallback values used before the menu has ever
// been opened / if a variable somehow isn't set:
const AMBIENCE_STATIC_BRIGHTNESS = 1;     // brightness multiplier when reactive mode is off
const AMBIENCE_REACTIVE_MIN = 0.7;        // brightness multiplier during quiet parts
const AMBIENCE_REACTIVE_MAX = 1.25;       // brightness multiplier at loudness peaks
const AMBIENCE_REACTIVE_SIZE_MAX = 2.5;   // size multiplier at loudness peaks (independent of brightness)
const AMBIENCE_REACTIVE_SMOOTHING = 0.25; // 0-1 per frame; higher = snappier, lower = smoother

// Append Styling To Head
console.log("[Cleanest ambience] script version: canvas-baked-blur-v1");

(function initStyle() {
	const style = document.createElement("style");
	style.textContent = `
		:root {
			--npv-ambience-spread: ${AMBIENCE_SPREAD_PX}px;
			--npv-ambience-blur: ${AMBIENCE_BLUR_PX}px;
			--npv-ambience-reactive-brightness: 1;
		}

		/* Toggleable NPV elements — hidden only while the matching body class
		   (set by loadToggles() above) is present, instead of permanently. */
		body.__cleanest_hide_lyrics [aria-label="Lyrics"],
		body.__cleanest_hide_lyrics [aria-label="Looks like we don't have the lyrics for this song."] {
			display: none !important;
		}
		body.__cleanest_hide_listeningactivity [aria-label="Listening activity"] {
			display: none !important;
		}
		body.__cleanest_hide_credits [class="main-nowPlayingView-section main-nowPlayingView-credits"] {
			display: none !important;
		}
		body.__cleanest_hide_merch [class="main-nowPlayingView-section UF4iFZpYucsei5By"] {
			display: none !important;
		}
		body.__cleanest_hide_aboutartist [class="a7gn1W5xEIEyxWUU"] {
			display: none !important;
		}
		body.__cleanest_hide_ontour [class="main-nowPlayingView-section y6MSp2Cg3wf9ZqdX"] {
			display: none !important;
		}
		/* [class~="X"] (not [class="X"]) — Spotify adds an extra class
		   ("encore-over-media-set") to this container specifically while
		   Canvas video is playing, which made the old exact-match
		   selector stop matching and silently do nothing only in that
		   state (confirmed via a DevTools screenshot). ~= matches any
		   single class in the space-separated list, so it's immune to
		   whatever else gets added alongside it. */
		body.__cleanest_hide_switchtovideo [class~="main-nowPlayingView-actionButtonContainer"] {
			display: none !important;
		}
		/* Confirmed exact aria-labels from your DevTools screenshot:
		   "Open Miniplayer" / "Enter Full screen" (likely toggle to
		   "Close Miniplayer" / "Exit Full screen" when active — the
		   substring matches below cover both states). Added :has() as a
		   fallback in case the aria-label sits on an inner element rather
		   than the clickable button itself, which would make hiding just
		   that inner piece leave an empty button-shaped gap instead of
		   fully removing it. */
		body.__cleanest_hide_miniplayer [aria-label*="iniplayer" i],
		body.__cleanest_hide_miniplayer button:has([aria-label*="iniplayer" i]) {
			display: none !important;
		}
		body.__cleanest_hide_fullscreen [aria-label*="ull screen" i],
		body.__cleanest_hide_fullscreen button:has([aria-label*="ull screen" i]) {
			display: none !important;
		}
		body.__cleanest_hide_queue [data-testid="now-playing-bar"] [aria-label="Queue"],
		body.__cleanest_hide_queue [data-testid="now-playing-bar"] button:has([aria-label="Queue"]) {
			display: none !important;
		}
		body.__cleanest_hide_connectdevice [data-testid="now-playing-bar"] [aria-label="Connect to a device"],
		body.__cleanest_hide_connectdevice [data-testid="now-playing-bar"] button:has([aria-label="Connect to a device"]) {
			display: none !important;
		}
		body.__cleanest_hide_whatsnew #global-nav-bar [aria-label="What's New"],
		body.__cleanest_hide_whatsnew #global-nav-bar button:has([aria-label="What's New"]) {
			display: none !important;
		}

		/* Cleanest Settings modal: section headers + the "greyed out while
		   disabled" state for ambience-dependent rows. Bundled into this
		   same injected stylesheet since it's the only one this theme sets
		   up — nothing to do with the glow itself. */
		.cleanestSectionHeader {
			font-size: 1rem;
			font-weight: 700;
			margin-top: 10px;
			margin-bottom: 2px;
			padding-bottom: 4px;
		}

		/* "Advanced theme settings" button + its modal. Deliberately plain —
		   just enough to be usable, not styled to match anything yet. */
		.cleanestAdvancedButton {
			margin-top: 8px;
			padding: 6px 10px;
			cursor: pointer;
			color: var(--spice-text);
			background: rgba(255, 255, 255, 0.1);
			border: none;
			border-radius: 4px;
			font-size: 0.8125rem;
		}
		.cleanestAdvancedButton:hover {
			background: rgba(255, 255, 255, 0.18);
		}
		.cleanestAdvancedModal {
			width: 100%;
			padding: 16px;
		}
		.cleanestAdvancedNote {
			font-size: 0.8125rem;
			color: var(--spice-subtext);
			margin: 0 0 12px 0;
		}
		.cleanestAdvancedModal .cleanestOptionRow {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 6px 0;
		}
		.cleanestBgControls {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.cleanestBgControls input[type="color"] {
			border: none;
			width: 28px;
			height: 22px;
			padding: 0;
			background: none;
			cursor: pointer;
		}
		.cleanestBgControls input[type="range"] {
			width: 100px;
		}
		.cleanestBgAlphaValue {
			font-size: 0.75rem;
			color: var(--spice-subtext);
			min-width: 34px;
			text-align: right;
		}
		.cleanestAdvancedResetRow {
			margin-top: 16px;
			padding-top: 10px;
			border-top: 1px solid rgba(255, 255, 255, 0.1);
		}
		.cleanestAdvancedResetButton {
			padding: 6px 10px;
			cursor: pointer;
			color: #ff6b6b;
			background: rgba(255, 107, 107, 0.12);
			border: none;
			border-radius: 4px;
			font-size: 0.8125rem;
		}
		.cleanestAdvancedResetButton:hover {
			background: rgba(255, 107, 107, 0.22);
		}
		.cleanestSubHeader {
			font-size: 0.75rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			opacity: 0.6;
			margin-top: 4px;
		}
		.cleanestModHeader {
			margin-top: 10px;
			padding-left: 4px;
			border-left: 2px solid rgba(255, 255, 255, 0.15);
		}
		.cleanestOptionRow.cleanest-disabled {
			opacity: 0.4;
			pointer-events: none;
		}
		/* Toggle rows: put the switch right next to its label instead of
		   pushed to the far right edge of the (narrow) column — with short
		   labels like "Credits:" the space-between gap from user.css looked
		   huge. Also tightened vertical spacing throughout so 8 rows worth
		   of settings fit without needing to scroll on most screens. */
		.cleanestSettingsColumn .cleanestOptionRow {
			justify-content: flex-start;
			gap: 10px;
			padding-top: 4px;
		}
		/* user.css right-aligns this label (fine for single-line text, but
		   wrapped 2-line labels like "Ambience reacts to music loudness"
		   ended up hugging the right edge instead of reading left-to-right
		   normally). */
		.cleanestSettingsColumn .cleanestOptionDesc {
			text-align: left;
			margin-right: 0;
		}
		.cleanestSettingsColumn .slider-container {
			padding-top: 0;
		}

		/* Widen the settings modal itself and lay Theme / Ambience Glow / Edge
		   Glow / Elements out side by side instead of one long vertical list.
		   Scoped to this specific modal via its aria-label so nothing else in
		   the app is affected. */
		div[aria-label="Cleanest Settings"] .main-trackCreditsModal-container {
			width: fit-content !important;
			min-width: 720px !important;
			max-width: 96vw !important;
			height: auto !important;
			max-height: 85vh !important;
		}
		/* Same treatment for the Advanced Theme Settings modal — it grew a
		   lot of rows (panel backgrounds + shadows + compatibility) and was
		   overflowing above the top of the window without a height cap. */
		div[aria-label="Advanced Theme Settings"] .main-trackCreditsModal-container {
			width: 640px !important;
			max-width: 96vw !important;
			height: auto !important;
			max-height: 85vh !important;
		}
		div[aria-label="Advanced Theme Settings"] .main-trackCreditsModal-mainSection {
			overflow-y: auto !important;
			height: auto !important;
			max-height: 85vh !important;
			padding-top: 12px !important;
			padding-bottom: 12px !important;
		}
		/* user.css sets this section to overflow-y: hidden (content just got
		   clipped if it didn't fit); switching to auto lets a shorter modal
		   scroll internally instead of being forced to grow tall enough to
		   show everything at once. */
		div[aria-label="Cleanest Settings"] .main-trackCreditsModal-mainSection {
			overflow-y: auto !important;
			height: auto !important;
			max-height: 85vh !important;
			padding-top: 12px !important;
			padding-bottom: 12px !important;
		}
		div[aria-label="Cleanest Settings"] #home-select {
			height: 80px !important;
			margin-bottom: 8px !important;
		}
		.cleanestSettingsColumns {
			display: flex;
			flex-wrap: wrap;
			gap: 18px;
			align-items: flex-start;
			margin-top: 4px;
		}
		.cleanestSettingsColumn {
			flex: 0 1 auto;
			min-width: 0;
			max-width: 220px;
		}
		.cleanestSettingsColumn .cleanestSectionHeader {
			margin-top: 0;
		}
		/* Long slider labels ("Ambience Spread", "Reactive Smoothness", "Edge
		   Glow Opacity"...) were wrapping to 2 lines and breaking alignment
		   in the narrower 3-column layout. Giving the label its own full row
		   makes wrapping harmless instead of fighting the slider for space. */
		.cleanestSettingsColumn .slider-container {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
		}
		.cleanestSettingsColumn .slider-container label {
			flex: 1 1 100%;
			text-align: left;
			margin-right: 0;
			margin-bottom: 4px;
			white-space: normal;
		}
		.cleanestSettingsColumn .slider-container input.slider {
			flex: 1 1 auto;
			max-width: 65%;
		}
		.cleanestSettingsColumn .slider-container .slider-value {
			flex: 0 0 auto;
		}
		/* Modal title + close button. DevTools confirmed the real markup:
		   .main-trackCreditsModal-header contains an <h1 class="main-type-alto">
		   (not an h2 — that was the bug in the last two attempts, the
		   selector never matched anything) followed by the close <button>.
		   The header itself isn't a flex row by default here, so the
		   button just falls onto its own line under the title. Making the
		   header a flex row, pinning the button to auto width, and letting
		   the title fill+center in the remaining space fixes both the
		   centering and the button position in one go. */
		div[aria-label="Cleanest Settings"] .main-trackCreditsModal-header,
		div[aria-label="Advanced Theme Settings"] .main-trackCreditsModal-header {
			display: flex !important;
			align-items: center !important;
			justify-content: space-between !important;
			gap: 12px !important;
		}
		div[aria-label="Cleanest Settings"] .main-trackCreditsModal-header h1,
		div[aria-label="Advanced Theme Settings"] .main-trackCreditsModal-header h1 {
			flex: 1 1 auto !important;
			text-align: center !important;
			margin: 0 !important;
			pointer-events: none !important;
		}
		div[aria-label="Cleanest Settings"] .main-trackCreditsModal-header .cleanestCloseBtn,
		div[aria-label="Advanced Theme Settings"] .main-trackCreditsModal-header .cleanestCloseBtn {
			flex: 0 0 auto !important;
			display: flex !important;
			align-items: center !important;
			justify-content: center !important;
			width: 28px !important;
			height: 28px !important;
			padding: 0 !important;
			margin: 0 !important;
			border: none !important;
			border-radius: 50% !important;
			background: transparent !important;
			color: var(--spice-text) !important;
			font-size: 14px !important;
			line-height: 1 !important;
			cursor: pointer !important;
		}
		div[aria-label="Cleanest Settings"] .main-trackCreditsModal-header .cleanestCloseBtn:hover,
		div[aria-label="Advanced Theme Settings"] .main-trackCreditsModal-header .cleanestCloseBtn:hover {
			background: rgba(255, 255, 255, 0.1) !important;
		}

		/* Screen edge glow: colored by the theme's own dynamic accent
		   (var(--spice-accent) — same variable the liked-songs heart uses),
		   not the cover art. Pure CSS — no JS polling needed, since Spicetify
		   itself keeps --spice-accent updated whenever it changes.
		   Deliberately kept BEHIND the app's own UI (low z-index) rather than
		   on top of it, so it reads as light bleeding in around the edges
		   through this theme's translucent panels, instead of a bright wash
		   sitting over the sidebar/player controls. */
		.npv-edge-glow {
			position: fixed;
			pointer-events: none;
			z-index: 999999;
			filter: blur(var(--npv-edge-glow-blur, 40px)) brightness(var(--npv-edge-glow-reactive-brightness, 1));
			opacity: calc(var(--npv-edge-glow-enabled, 1) * var(--npv-edge-glow-opacity, 0.3));
			transition: opacity 0.4s ease, background 0.4s ease;
		}
		.npv-edge-glow--left {
			top: 0;
			left: 0;
			bottom: 0;
			width: var(--npv-edge-glow-size, 100px);
			background: linear-gradient(to right, var(--spice-accent, #1db954), transparent);
		}
		.npv-edge-glow--top {
			top: 0;
			left: 0;
			right: 0;
			height: var(--npv-edge-glow-size, 100px);
			background: linear-gradient(to bottom, var(--spice-accent, #1db954), transparent);
		}
		.npv-edge-glow--bottom {
			bottom: 0;
			left: 0;
			right: 0;
			height: var(--npv-edge-glow-size, 100px);
			background: linear-gradient(to top, var(--spice-accent, #1db954), transparent);
		}
		body.__cleanest_hide_edgeglow_top .npv-edge-glow--top,
		body.__cleanest_hide_edgeglow_left .npv-edge-glow--left,
		body.__cleanest_hide_edgeglow_bottom .npv-edge-glow--bottom {
			display: none !important;
		}

		/* Second attempt at sidebars-reach-the-bottom, this time NOT
		   touching grid-template-areas at all (that's what broke things
		   before — likely conflicted with extra named grid lines the
		   decorative overlay elements depend on, which stay fully intact
		   this way). Instead, just moving these 4 specific elements to
		   explicit numeric grid coordinates. DevTools' computed styles
		   confirmed 4 rows x 3 columns (rows: top-banner / global-nav+
		   right-sidebar / left-sidebar+main-view+right-sidebar /
		   now-playing-bar — that's 5 grid lines, 1 through 5). The first
		   pass used "2 / 4", which stops right at the line *before* the
		   now-playing-bar row — the sidebar cell was already 100% tall,
		   it just wasn't reaching that far down. "2 / 5" spans all the
		   way through it. An element's own grid-row/grid-column always
		   overrides whatever grid-area(name) it also has, so this
		   doesn't require removing or fighting that. */
		body.__cleanest_extend_sidebars .Root__nav-bar {
			grid-row: 2 / 5 !important;
			grid-column: 1 !important;
			height: 100% !important;
			align-self: stretch !important;
			padding-top: 12px !important;
			box-sizing: border-box !important;
		}
		body.__cleanest_extend_sidebars .Root__right-sidebar {
			grid-row: 2 / 5 !important;
			grid-column: 3 !important;
			height: 100% !important;
			align-self: stretch !important;
			padding-top: 12px !important;
			box-sizing: border-box !important;
		}
		/* The outer grid cell now correctly spans the full height, but the
		   inner content wrapper (queue list, library list, etc.) has its
		   own separate height that doesn't automatically inherit a taller
		   parent — forcing height:100% down a couple more levels so the
		   actual scrollable list reaches the bottom too, not just its
		   invisible outer box. */
		body.__cleanest_extend_sidebars .Root__right-sidebar > *,
		body.__cleanest_extend_sidebars .Root__right-sidebar aside,
		body.__cleanest_extend_sidebars .Root__right-sidebar aside > *,
		body.__cleanest_extend_sidebars .Root__nav-bar > *,
		body.__cleanest_extend_sidebars .Root__nav-bar nav {
			height: 100% !important;
		}
		/* The rule above still wasn't enough for the right sidebar: DevTools
		   showed several more wrapper divs sitting between .Root__right-sidebar
		   and the actual <aside> Queue/NPV panel (a class-name animation
		   wrapper, an aria-hidden wrapper, the .main-nowPlayingView-container
		   itself, etc.) — none of them inherit height automatically, so the
		   chain kept collapsing back to content size a few levels down.
		   Naming each one explicitly closes that gap. If this stops working
		   after a Spotify update, open DevTools on .Root__right-sidebar,
		   expand it down to <aside>, and send me the new class names. */
		body.__cleanest_extend_sidebars .Root__right-sidebar .qnaFIKUJ9oUIkN97,
		body.__cleanest_extend_sidebars .Root__right-sidebar .a_fKt7xvd8od_kEb,
		body.__cleanest_extend_sidebars .Root__right-sidebar .main-nowPlayingView-container,
		body.__cleanest_extend_sidebars .Root__right-sidebar .ehfPbmtbhkOuWeF_,
		body.__cleanest_extend_sidebars .Root__right-sidebar .FkNJ0wTwiYzUMox6 {
			height: 100% !important;
		}
		/* main-view and now-playing-bar's row (Y) are left completely
		   untouched this time — forcing those earlier is what pushed the
		   player controls up to the top. Only now-playing-bar's column (X)
		   is narrowed, so it stays in whatever row Spotify already puts it
		   in, just visually centered between the now-taller sidebars. */
		body.__cleanest_extend_sidebars .Root__now-playing-bar {
			grid-column: 2 !important;
			min-width: 0 !important;
		}

		/* Real elements attached to <body> (not inside the sidebar's DOM
		   tree), so the sidebar's own overflow clipping can't cut off the
		   glow at its edge. Position/size is synced to the cover art via JS. */
		/* The clipping window: native overflow:hidden crops the glow layer
		   inside it. Spans the whole viewport by default (no visible
		   clipping effect) — its top edge only gets pulled down to the
		   header's bottom edge when the sidebar is actually scrolled (see
		   npvAmbience() below), which is what stops the glow from painting
		   over the header once the cover scrolls up behind it. */
		.npv-ambience-glow-clip {
			position: fixed;
			overflow: hidden;
			pointer-events: none;
			z-index: 9999;
		}
		.npv-ambience-glow-layer {
			content: "";
			position: absolute;
			pointer-events: none;
			background-position: center;
			background-size: cover;
			background-repeat: no-repeat;
			/* transition used to be the "background" shorthand, which also
			   covers background-position and background-size — not just
			   background-image. Those two are rewritten every frame (cover
			   tracking, reactive size pulse), so the shorthand was making
			   them visibly ease toward their target over half a second
			   instead of snapping — that's what looked like lag, even with
			   the cover itself sitting still. Scoping the transition to
			   just background-image keeps the smooth crossfade on track
			   change while position/size apply instantly. */
			transition: background-image 0.5s ease, opacity 0.5s ease;
			opacity: var(--npv-ambience-opacity, 0);
		}

		/* Modals (e.g. the settings window) were rendering BEHIND the ambience
		   glow / edge glow, which both sit at very high z-index on purpose
		   (attached straight to <body>, need to stay above the app's own
		   panels). Spotify's own dialogs default to z-index:100, which loses
		   to both. Dialogs should always win over decorative effects, so
		   this is pushed above the higher of the two (edge glow, 999999). */
		.GenericModal__overlay {
			z-index: 1000000 !important;
		}

		/* One blurred/tinted element for the whole frame, with a clip-path
		   hole cut out for the cover art itself (see npvAmbience() below). */
		.npv-ambience-glow-layer--tint {
			filter: blur(var(--npv-ambience-blur)) saturate(2.3) contrast(1.6) brightness(var(--npv-ambience-reactive-brightness, 1));
		}

		/* compatibility: since spotify 1.2.87; spicetify v2.42.2 */
		.Root__right-sidebar aside .main-nowPlayingView-headerContainer {
			position: relative;
			width: 100%;
			z-index: 1;
			background: transparent;
			transition: background-color 0.25s, backdrop-filter 0.5s, opacity 0.4s ease-out;
		}

		.Root__right-sidebar aside .main-nowPlayingView-headerContainer.BEeVmHj340c0PYHe {
			height: 63px;
			background-color: rgba(var(--spice-rgb-main), 0.2) !important;
			backdrop-filter: blur(24px) saturate(140%) brightness(0.6);
			border-bottom: 1px solid rgba(var(--spice-rgb-selected-row),0.2);
		}

		.Root__right-sidebar aside:has(.main-nowPlayingView-headerContainer) .main-nowPlayingView-mainContainer {
		    padding-top: 64px;
		}
		/*  */

		/* compatibility: spotify<1.2.87; spicetify<v2.43.2 ("<", not "=<") */
		.Root__right-sidebar aside .xjf0Pj3YnoegOkJUpaPS {
			position: absolute;
			width: 100%;
			z-index: 1;
			background: transparent;
			transition: background-color 0.25s, backdrop-filter 0.5s, opacity 0.4s ease-out;
		}

		.Root__right-sidebar aside .xjf0Pj3YnoegOkJUpaPS.EnViFhuIR5WVeEopJHu3 {
			height: 63px;
			background-color: rgba(var(--spice-rgb-main), 0.2) !important;
			backdrop-filter: blur(24px) saturate(140%) brightness(0.6);
			border-bottom: 1px solid rgba(var(--spice-rgb-selected-row),0.2);
		}

		.Root__right-sidebar aside:has(.xjf0Pj3YnoegOkJUpaPS) .wfJD_yK4h7xnpTmrh62U {
			padding-top: 64px;
		}
		/*  */

		/* compatibility: spotify=1.2.51; spicetify v2.38.5 */
		.Root__right-sidebar aside .W3E0IT3_STcazjTeyOJa, .Root__right-sidebar aside .ZbDMGdU4aBOnrNLowNRq {
			position: absolute;
			width: 100%;
			z-index: 1;
			background: transparent;
			transition: background-color 0.25s, backdrop-filter 0.5s, opacity 0.4s ease-out;
		}

		.Root__right-sidebar aside .W3E0IT3_STcazjTeyOJa.mdMUqcSHFw1lZIcYEblu, .Root__right-sidebar aside .ZbDMGdU4aBOnrNLowNRq.fAte2d0xETy7pnDUAgHY {
			height: 63px;
			background-color: rgba(var(--spice-rgb-main), 0.2) !important;
			backdrop-filter: blur(24px) saturate(140%) brightness(0.6);
			border-bottom: 1px solid rgba(var(--spice-rgb-selected-row),0.2);
		}

		.Root__right-sidebar aside:has(.W3E0IT3_STcazjTeyOJa) .zduvaX0Ioxqd5ypeWoAf, .Root__right-sidebar aside:has(.ZbDMGdU4aBOnrNLowNRq) .main-buddyFeed-scrollBarContainer:not(:has(.main-buddyFeed-content > .main-buddyFeed-header)) {
			padding-top: 64px;
		}
		/*  */


		.Root__right-sidebar aside {
			--background-base: var(--spice-main) !important;
		}

		.main-nowPlayingView-gradient,
		.IkRGajTjItEFQkRMeH6v.f2UE9n5nZcbgZrGYTU3r {
			background: none !important;
		}

		/* Badge-repositioning experiments (re-parenting it into the player
		   controls row, then absolutely positioning it there) didn't work
		   out — kept landing in the wrong place / wrong size regardless of
		   selector precision. Simplest fix: just hide it, it was only
		   getting in the way. */
		#wavelink-source-badge {
			display: none !important;
		}

		/* Wavelink's own SoundCloud pause-icon overlay (index.js) hardcodes
		   background-color: #000 for its CSS-mask icon, on the assumption
		   that the play/pause button still has Spotify's default white
		   circle behind it. Cleanest makes that button transparent
		   (.main-playPauseButton-button { background-color: transparent })
		   and colors its icons with var(--spice-text) everywhere else — so
		   against a transparent/dark button, Wavelink's hardcoded black
		   icon is invisible instead of just "a dark icon on white". Matching
		   the same var(--spice-text) used for every other transport button
		   fixes contrast without touching Wavelink's own files. */
		body.sc-playing [data-testid="control-button-playpause"]::after {
			background-color: var(--spice-text) !important;
		}
	`;
	document.head.appendChild(style);
})();

// Screen edge glow — three simple elements, created once. No per-frame JS
// needed at all: color comes from var(--spice-accent), which Spicetify
// itself keeps updated, and size/blur/opacity are plain CSS custom
// properties driven by the settings menu.
(function edgeGlow() {
	for (const side of ["left", "top", "bottom"]) {
		const el = document.createElement("div");
		el.className = `npv-edge-glow npv-edge-glow--${side}`;
		document.body.appendChild(el);
	}
})();

(function npvAmbience() {
	const rightSidebar = document.querySelector(".Root__right-sidebar");
	if (!(Spicetify.Player.data && rightSidebar)) {
		setTimeout(npvAmbience, 10);
		return;
	}

	// Single "frame" element per filter layer, attached directly to <body>.
	// Previously this was 4 separate strip elements (top/bottom/left/right)
	// so the glow could stay at a high z-index (always drawn above
	// everything, sidestepping the app's unpredictable internal stacking
	// order) without ever visually covering the cover art itself — each
	// strip only ever occupied the margin area around it.
	// Same safety property, one element: clip-path cuts a rectangular hole
	// exactly matching the cover art's own rect out of the middle of a
	// single square glow, using the evenodd fill rule (outer rectangle +
	// inner rectangle drawn in the same path only paints the ring between
	// them). This drops the blur filter from running on 4 elements down to
	// 1, which is the actual expensive part — blurring is a full-surface
	// rasterization pass, so 4 smaller blurred areas cost roughly as much
	// as 1 big one, not less.
	// Builds SVG path data for a rectangle with rounded corners — used to
	// cut the glow's inner hole to the same shape as the cover art, instead
	// of a hard rectangle. (clip-path: path() takes real SVG path syntax,
	// which supports arcs; polygon() only does straight edges.)
	function roundedRectPathData(x, y, w, h, r) {
		r = Math.max(Math.min(r, w / 2, h / 2), 0);
		if (r === 0) return `M${x},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h} Z`;
		return `M${x + r},${y} `
			+ `L${x + w - r},${y} A${r},${r} 0 0 1 ${x + w},${y + r} `
			+ `L${x + w},${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} `
			+ `L${x + r},${y + h} A${r},${r} 0 0 1 ${x},${y + h - r} `
			+ `L${x},${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
	}

	// The "left side only" strip's L-shape (cap along the top narrowing
	// down into the vertical strip beside the video). Plain hard right-
	// angle corner at the notch, on purpose — every attempt at smoothing
	// this specific corner so far (a two-arc S-curve, a single elliptical
	// arc, a blurred-mask union) came out wrong in a different way each
	// time — bulging outward, reading as a tilt/lean, or breaking the
	// mask entirely. A correct, reliable hard corner beats another
	// incorrect soft one; this can be revisited once there's a properly
	// verified way to soften it.
	function leftOnlyClipPathData(topCapWidth, topCapHeight, stripWidth, wrapperHeight) {
		return `M0,0 L${topCapWidth},0 L${topCapWidth},${topCapHeight} L${stripWidth},${topCapHeight} `
			+ `L${stripWidth},${wrapperHeight} L0,${wrapperHeight} Z`;
	}

	// The cover art itself is rounded (border-radius), so a hard rectangular
	// hole leaves a gap at each corner where neither the artwork nor the
	// glow paints anything — showing raw dark background through as small
	// black corner notches. Reading the radius straight from the actual
	// element (rather than hardcoding a guess) keeps this matching exactly
	// even if Spotify changes it in a future update.
	// Checks the actual visible media element (mediaEl — video when
	// "Switch to video"/Canvas is active, img otherwise) first, then its
	// immediate parent (rounding is sometimes applied to a clipping
	// wrapper around the video rather than the <video> tag itself), then
	// falls back to the container.
	function getCoverCornerRadius(coverEl, mediaEl) {
		const candidates = [mediaEl, mediaEl?.parentElement, coverEl, coverEl.querySelector("img")].filter(Boolean);
		for (const el of candidates) {
			const r = Number.parseFloat(getComputedStyle(el).borderRadius);
			if (r > 0) return r;
		}
		return 8; // sane fallback if nothing reports a radius
	}

	// The actual visible media surface inside the cover art container —
	// a <video> when Canvas/"Switch to video" is showing a clip, an <img>
	// otherwise. Measuring this element directly (rather than the
	// container) keeps the glow's cutout matching what's actually on
	// screen even if Spotify wraps the video in extra padding/letterboxing
	// that doesn't match the container's own box.
	//
	// While Wavelink owns playback (sc-active), Spotify's own Canvas
	// <video> from whatever track played last through Spotify itself can
	// still be sitting in the DOM, just hidden rather than removed — so
	// querySelector("video") kept finding it and treating Wavelink/
	// SoundCloud tracks as "video mode" too, leaving canvas-video-only
	// glow behavior (and the CORS-safe non-analysis of it) stuck on even
	// though nothing relevant is actually playing there anymore. Wavelink
	// never renders its own cover via <video> (only <img>, confirmed
	// earlier via getWavelinkRenderedCoverUrl()), so skipping the video
	// check outright whenever Wavelink is active sidesteps the stale
	// element entirely rather than trying to detect "stale" some other
	// way.
	function getCoverMediaEl(coverEl) {
		if (document.body.classList.contains("sc-active")) {
			return coverEl.querySelector("img") || coverEl;
		}
		return coverEl.querySelector("video") || coverEl.querySelector("img") || coverEl;
	}

	// Wrapping the glow in its own clipping window rather than appending it
	// straight to <body>: this wrapper's box (native overflow: hidden) is
	// what enforces the "don't paint above the header once scrolled" rule
	// now, instead of folding that into the clip-path used for the cover
	// art cutout. clip-path combined with filter: blur() on the same
	// element, recalculated every frame, turned out to be unreliable for
	// this — switching to plain overflow clipping on a separate element
	// removes that risk entirely (overflow: hidden has no path syntax to
	// get wrong).
	function makeLayerSet(modifierClass) {
		const wrapper = document.createElement("div");
		wrapper.className = "npv-ambience-glow-clip";
		const el = document.createElement("div");
		el.className = `npv-ambience-glow-layer ${modifierClass}`;
		wrapper.appendChild(el);
		document.body.appendChild(wrapper);
		return { wrapper, el };
	}

	const layers = makeLayerSet("npv-ambience-glow-layer--tint");
	const allLayers = [layers];

	// --- Reactive brightness state ---
	let audioSegments = null;   // segments[] from Spicetify.getAudioData() — fallback source (overall loudness)
	let segmentCursor = 0;      // index into audioSegments, advanced as playback progresses
	let loudnessFloor = -30;    // this track's own quietest segment peak (dB), for normalization
	let loudnessCeil = -5;      // this track's own loudest segment peak (dB), for normalization
	let audioBeats = null;      // beats[] from Spicetify.getAudioData() — primary source (rhythmic "punch")
	let beatCursor = 0;
	let smoothedBrightness = 1;
	let smoothedSizeMult = 1;

	// --- Canvas video ambience: live-updating glow instead of a static
	// blurred image ---
	// First attempt cloned Spotify's <video> into a second element with
	// the same src to play independently — but Canvas videos load from a
	// blob: URL, and Spotify revokes that URL shortly after its own
	// <video> finishes loading it (freeing memory once it doesn't need
	// the blob anymore). A second element requesting the same
	// already-revoked blob: URL fails outright (net::ERR_FILE_NOT_FOUND
	// — confirmed via logging), so that approach is a dead end.
	// This instead repeatedly copies the CURRENT FRAME of Spotify's own,
	// already-playing <video> onto a small <canvas> via drawImage() —
	// no new network/blob request at all, so the revoked-URL problem
	// never comes up, and it's automatically always in perfect sync since
	// it's quite literally the same element's pixels each time. Also
	// sidesteps CORS entirely for a different reason than the blob issue:
	// drawImage() copying a frame onto a canvas is always allowed
	// regardless of cross-origin-ness; only reading pixels back out of
	// that canvas afterward (getImageData/toDataURL — neither of which
	// this does) is what CORS would restrict. Never touches Spotify's own
	// <video> element itself — no src/currentTime/play/pause calls on it,
	// strictly read-only via drawImage().
	let ambienceVideoCanvas = null;
	let ambienceVideoCtx = null;
	let lastAmbienceFrameDraw = 0;
	// Tracks which <video> the requestVideoFrameCallback chain (if any) is
	// currently following — set to null to make the chain stop scheduling
	// itself on its next tick, without needing a fragile call to
	// cancelVideoFrameCallback with a possibly-stale handle.
	let ambienceVideoRvfcSource = null;
	function drawAmbienceVideoFrame(sourceVideo) {
		if (!ambienceVideoCtx || sourceVideo.readyState < 2) return;
		try {
			ambienceVideoCtx.drawImage(sourceVideo, 0, 0, ambienceVideoCanvas.width, ambienceVideoCanvas.height);
		} catch (err) {
			// Defensive only — drawImage() itself doesn't require
			// cross-origin permission, but bail out quietly rather than
			// spamming errors every frame if a browser disagrees.
		}
	}
	function ensureAmbienceVideoAttached(sourceVideo) {
		if (!ambienceVideoCanvas) {
			const canvas = document.createElement("canvas");
			// Small on purpose — this gets heavily blurred by the layer's
			// own CSS filter regardless, so a low-res source costs far less
			// per-frame drawImage() work without any visible quality loss.
			canvas.width = 64;
			canvas.height = 64;
			canvas.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;";
			ambienceVideoCanvas = canvas;
			ambienceVideoCtx = canvas.getContext("2d");
		}
		if (ambienceVideoCanvas.parentElement !== layers.el) {
			layers.el.appendChild(ambienceVideoCanvas);
		}
		// Prefer requestVideoFrameCallback where available — it fires
		// exactly when the browser presents a newly-decoded frame, so the
		// ambience tracks actual playback rather than polling on a fixed
		// timer that can double-sample the same frame or skip one. Falls
		// back to the simple throttled-poll approach otherwise.
		if (typeof sourceVideo.requestVideoFrameCallback === "function") {
			if (ambienceVideoRvfcSource !== sourceVideo) {
				ambienceVideoRvfcSource = sourceVideo;
				const onFrame = () => {
					// Source changed or detached since this was scheduled —
					// let the chain die instead of scheduling another tick.
					if (ambienceVideoRvfcSource !== sourceVideo) return;
					drawAmbienceVideoFrame(sourceVideo);
					sourceVideo.requestVideoFrameCallback(onFrame);
				};
				sourceVideo.requestVideoFrameCallback(onFrame);
			}
		} else {
			const now = Date.now();
			if (now - lastAmbienceFrameDraw > 80) {
				lastAmbienceFrameDraw = now;
				drawAmbienceVideoFrame(sourceVideo);
			}
		}
	}
	function detachAmbienceVideo() {
		if (ambienceVideoCanvas && ambienceVideoCanvas.parentElement) {
			ambienceVideoCanvas.remove();
		}
		ambienceVideoRvfcSource = null;
	}

	// TEMPORARY diagnostic — logs once every ~3s to check whether the
	// canvas-video path is actually being reached and what it sees at
	// each step, since this can't be verified without a live browser.
	// Remove once confirmed working.
	let _wlDebugLastVideoLog = 0;
	function _wlDebugLogVideoAmbience(isVideoMode, mediaEl) {
		const now = Date.now();
		if (now - _wlDebugLastVideoLog < 3000) return;
		_wlDebugLastVideoLog = now;
		console.log(
			"[Cleanest/AmbienceVideo] isVideoMode:", isVideoMode,
			"mediaEl.tagName:", mediaEl.tagName,
			"sync toggle class present:", document.body.classList.contains("__cleanest_ambience_video_sync"),
			"leftOnly toggle class present:", document.body.classList.contains("__cleanest_ambience_video_leftonly"),
			isVideoMode ? "readyState:" : "",
			isVideoMode ? mediaEl.readyState : "",
			"canvas attached:", !!(ambienceVideoCanvas && ambienceVideoCanvas.parentElement)
		);
	}

	async function loadAudioAnalysis() {
		audioSegments = null;
		segmentCursor = 0;
		audioBeats = null;
		beatCursor = 0;
		// Always fetched regardless of the reactive toggle, so switching it
		// on in settings takes effect immediately instead of waiting for
		// the next song change.
		try {
			const data = await Spicetify.getAudioData();

			const beats = data && data.beats;
			if (beats && beats.length) audioBeats = beats;

			const segments = data && data.segments;
			if (!segments || !segments.length) return;

			let min = Infinity, max = -Infinity;
			for (const s of segments) {
				if (typeof s.loudness_max === "number") {
					if (s.loudness_max < min) min = s.loudness_max;
					if (s.loudness_max > max) max = s.loudness_max;
				}
			}
			// Use this track's own dynamic range when it's meaningful; otherwise
			// fall back to a generic range rather than dividing by ~0.
			if (isFinite(min) && isFinite(max) && max - min >= 1) {
				loudnessFloor = min;
				loudnessCeil = max;
			} else {
				loudnessFloor = -30;
				loudnessCeil = -5;
			}
			audioSegments = segments;
		} catch (err) {
			// Not every track has analysis data (podcasts, some local files, etc.)
			audioSegments = null;
			audioBeats = null;
		}
	}

	// Spotify doesn't expose a bass/frequency-band-specific signal — only
	// overall segment loudness and beat timings. The closest honest proxy
	// for "reacts to the bass" is a sharp flash on each detected beat
	// (kick/bass usually drives the rhythmic pulse in most music), decaying
	// quickly afterward — rather than the broader, slower loudness curve
	// (which vocals/cymbals/etc. also move).
	function getBeatPunch(posSec) {
		if (!audioBeats || audioBeats.length === 0) return null;

		if (beatCursor >= audioBeats.length) beatCursor = audioBeats.length - 1;
		if (posSec < audioBeats[beatCursor].start) {
			let lo = 0, hi = audioBeats.length - 1;
			while (lo < hi) {
				const mid = (lo + hi + 1) >> 1;
				if (audioBeats[mid].start <= posSec) lo = mid;
				else hi = mid - 1;
			}
			beatCursor = lo;
		} else {
			while (beatCursor + 1 < audioBeats.length && audioBeats[beatCursor + 1].start <= posSec) {
				beatCursor++;
			}
		}

		const beat = audioBeats[beatCursor];
		const sinceBeat = Math.max(posSec - beat.start, 0);
		const confidence = typeof beat.confidence === "number" ? beat.confidence : 0.6;
		const decaySeconds = 0.2; // how quickly the flash fades after each beat
		return confidence * Math.exp(-sinceBeat / decaySeconds);
	}

	function findSegmentIndex(posSec) {
		let lo = 0, hi = audioSegments.length - 1;
		while (lo < hi) {
			const mid = (lo + hi + 1) >> 1;
			if (audioSegments[mid].start <= posSec) lo = mid;
			else hi = mid - 1;
		}
		return lo;
	}

	// Interpolates this instant's loudness (dB) from the segment covering
	// posSec, following Spotify's own attack/release shape for that segment:
	// loudness_start -> loudness_max (at loudness_max_time) -> loudness_end.
	function getSegmentLoudnessDb(posSec) {
		if (!audioSegments || audioSegments.length === 0) return null;

		if (segmentCursor >= audioSegments.length) segmentCursor = audioSegments.length - 1;
		if (posSec < audioSegments[segmentCursor].start) {
			segmentCursor = findSegmentIndex(posSec); // seeked backward — relocate
		} else {
			while (
				segmentCursor + 1 < audioSegments.length &&
				audioSegments[segmentCursor + 1].start <= posSec
			) {
				segmentCursor++;
			}
		}

		const seg = audioSegments[segmentCursor];
		const tInSeg = posSec - seg.start;
		const maxT = seg.loudness_max_time || 0;
		const loudEnd = typeof seg.loudness_end === "number" ? seg.loudness_end : seg.loudness_max;

		if (tInSeg <= maxT) {
			const span = Math.max(maxT, 0.001);
			const p = Math.min(Math.max(tInSeg / span, 0), 1);
			return seg.loudness_start + (seg.loudness_max - seg.loudness_start) * p;
		}
		const span = Math.max(seg.duration - maxT, 0.001);
		const p = Math.min(Math.max((tInSeg - maxT) / span, 0), 1);
		return seg.loudness_max + (loudEnd - seg.loudness_max) * p;
	}

	// Wavelink plays audio through a plain <audio id="wavelink-audio">
	// element sourced from SoundCloud's CDN, which does not send CORS
	// headers. Attaching a Web Audio AnalyserNode to it (via
	// createMediaElementSource) was tried for real frequency-based
	// "punch" data, but two things ruled that out for good:
	//   1. A CORS-tainted source makes getByteFrequencyData() return all
	//      zeros forever — no usable data, confirmed via logging.
	//   2. createMediaElementSource() permanently reroutes the element's
	//      audio output through the Web Audio graph. If anything in that
	//      graph misbehaves (suspended context, routing conflict with
	//      Wavelink's own playback handling, etc.), the track's audio
	//      goes silent with no way to reconnect the element back to its
	//      normal output — this is exactly what caused playback to cut
	//      out entirely and require a full Spotify restart.
	// So Wavelink tracks never get real audio-reactive data. Ambience/edge
	// glow falls back to static brightness for them instead — see the
	// `scActive` checks in masterLoop() below. No AnalyserNode, no
	// createMediaElementSource, no touching #wavelink-audio's output path
	// at all, so this can't take down playback again.

	// Wavelink (a separate custom app for playing SoundCloud etc. through
	// Spotify's UI) takes over the now-playing bar/panel when active — it
	// marks this with `body.sc-active`, and injects its own <img> elements
	// (some tagged [data-wl-owned]) into the exact same cover-art containers
	// this file already watches, showing the REAL currently-playing track's
	// artwork. Spotify's own Player metadata doesn't know about this at
	// all (Spotify has no idea a SoundCloud track is playing), so reading
	// metadata.image_xlarge_url etc. during Wavelink playback would color
	// the glow using whatever Spotify track was playing last — stale and
	// often just wrong. Reading the actual rendered <img> instead sidesteps
	// needing to know how Wavelink internally fetches/caches artwork; it
	// just reflects whatever's really on screen right now.

	// Minimal, self-contained restore of the normal Spotify-track-driven
	// background (--image_url) — deliberately NOT calling the "real"
	// getCurrentBackground()/onSongChange() from the main settings IIFE,
	// since those live in a completely separate closure and aren't
	// reachable from here (that mismatch is what silently threw and broke
	// this in the first place). This skips the "Custom background" toggle
	// check that version has, but a genuine Spotify songchange firing
	// shortly after Wavelink releases control will correct that anyway via
	// its own normal path — this only needs to cover the brief gap.
	function restoreSpotifyBackground() {
		const url = Spicetify?.Player?.data?.item?.metadata?.image_url;
		if (!url) return;
		const resolved = url.replace("spotify:image:", "https://i.scdn.co/image/");
		document.documentElement.style.setProperty("--image_url", `url("${resolved}")`);
	}

	// Self-contained duplicate of the main settings IIFE's accent-color
	// extraction (findColor/isTooDark/isTooCloseToWhite/rgbToHex) — that
	// version lives in a separate closure and isn't reachable from here,
	// same reason restoreSpotifyBackground() above is its own minimal
	// copy rather than a call into onSongChange(). Every element that
	// colors itself off the current track (liked-songs heart, buttons,
	// edge glow, etc.) reads the --spice-accent/--spice-button/
	// --spice-button-active CSS custom properties rather than recomputing
	// anything itself, so writing those three here is enough to make all
	// of them follow Wavelink's cover art too — no per-element changes
	// needed elsewhere.
	function isColorTooDark(rgb) {
		const brightness = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
		return brightness < 100;
	}
	function isColorTooCloseToWhite(rgb) {
		return rgb.r > 200 && rgb.g > 200 && rgb.b > 200;
	}
	function rgbToHexLocal(r, g, b) {
		return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
	}
	function findDominantColor(rgbList, skipFilters = false) {
		const colorCount = {};
		let maxColor = "";
		let maxCount = 0;
		for (let i = 0; i < rgbList.length; i++) {
			if (!skipFilters && (isColorTooDark(rgbList[i]) || isColorTooCloseToWhite(rgbList[i]))) continue;
			const key = `${rgbList[i].r},${rgbList[i].g},${rgbList[i].b}`;
			colorCount[key] = (colorCount[key] || 0) + 1;
			if (colorCount[key] > maxCount) {
				maxColor = key;
				maxCount = colorCount[key];
			}
		}
		return maxColor ? rgbToHexLocal(...maxColor.split(",").map(Number)) : null;
	}
	function setAccentColorVars(hex) {
		document.documentElement.style.setProperty("--spice-button", hex);
		document.documentElement.style.setProperty("--spice-button-active", hex);
		document.documentElement.style.setProperty("--spice-accent", hex);
	}
	// Throttled diagnostic — SoundCloud's image CDN generally does send
	// CORS headers (unlike the audio CDN, which is what broke playback
	// earlier), but if a particular image doesn't, drawing it to canvas
	// taints the canvas and getImageData() throws. That's caught below and
	// just skipped — leaves whatever accent color was already set rather
	// than crashing anything, since this whole path only ever reads a
	// plain <img>'s pixels and never touches audio.
	let _accentErrLastLog = 0;
	function extractDominantColor(url, callback) {
		if (!url) return;
		const img = new Image();
		img.crossOrigin = "Anonymous";
		img.onload = function () {
			try {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				canvas.width = img.width;
				canvas.height = img.height;
				ctx.drawImage(img, 0, 0);
				const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
				const rgbList = [];
				for (let i = 0; i < data.length; i += 4) {
					rgbList.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
				}
				const hex = findDominantColor(rgbList) || findDominantColor(rgbList, true);
				if (hex) callback(hex);
			} catch (err) {
				const now = Date.now();
				if (now - _accentErrLastLog > 5000) {
					_accentErrLastLog = now;
					console.log("[Cleanest/Wavelink] accent color extraction failed (likely CORS-tainted image):", err);
				}
			}
		};
		img.src = url;
	}
	// Mirrors restoreSpotifyBackground()'s minimal-restore approach: once
	// Spotify has real playback again, recompute accent color from its
	// current track image directly, rather than waiting on onSongChange()
	// in the other closure (which won't refire if the same Spotify track
	// was already loaded before Wavelink took over).
	function restoreSpotifyAccentColor() {
		const url = Spicetify?.Player?.data?.item?.metadata?.image_url;
		if (!url) return;
		const resolved = url.replace("spotify:image:", "https://i.scdn.co/image/");
		extractDominantColor(resolved, setAccentColorVars);
	}

	// The actual on-screen cover art element/src lookup, independent of any
	// toggle — Cover art sync and Panel background sync are separate
	// features with separate toggles, and each should work regardless of
	// whether the other is enabled. (Previously background sync went
	// through getEffectiveCoverUrl(), which itself gates on the Cover art
	// sync toggle — turning that off made background sync silently fall
	// back to Spotify's stale/often-empty metadata URL instead of just
	// being independent of it.)
	function getWavelinkRenderedCoverUrl() {
		if (!document.body.classList.contains("sc-active")) return null;
		const cover = document.querySelector(".main-nowPlayingView-coverArtContainer");
		const img = cover?.querySelector("img[data-wl-owned], img.cover-art-image, img");
		return img?.currentSrc || img?.src || null;
	}

	function getEffectiveCoverUrl(metadata) {
		const wavelinkCoverSyncEnabled = document.body.classList.contains("__cleanest_compat_wavelink_cover");
		if (wavelinkCoverSyncEnabled) {
			const src = getWavelinkRenderedCoverUrl();
			if (src) return src;
		}
		return metadata.image_xlarge_url || metadata.image_large_url || metadata.image_url;
	}

	function setImage(metadata) {
		// Using the full-res image here on purpose: at larger Spread values
		// the source gets stretched over a much bigger virtual canvas (see
		// the "windowing" technique in syncPosition below) before being
		// blurred — a smaller source image stretched that far washes out
		// into a flat, textureless smear instead of a soft colorful glow.
		const url = getEffectiveCoverUrl(metadata);
		const bg = `url(${url})`;
		for (const layer of allLayers) {
			layer.el.style.backgroundImage = bg;
		}
	}

	// Keep each strip locked to the cover art's on-screen position/size,
	// and pulse brightness with the track's loudness at the current
	// position — but only while Now Playing View's cover art actually
	// exists in the DOM. The loop stops itself the moment the cover art
	// disappears (sidebar collapsed, NPV closed, navigated away, etc.)
	// instead of running forever at 60fps in the background — that
	// constant work (recalculating style + repainting several blurred,
	// filtered layers every single frame indefinitely) is what was driving
	// up CPU and, over long sessions, memory.
	// Spotify's own progress reporting (Spicetify.Player.getProgress()) only
	// updates in coarse bursts, not every frame — using it directly caused
	// the pulse to visibly lag behind the actual beat. Instead, interpolate
	// the exact position ourselves from the last known position + how much
	// wall-clock time has passed since then, which is accurate to the frame.
	function getPrecisePositionMs() {
		const data = Spicetify.Player.data;
		if (!data) return 0;
		if (data.isPaused) return data.positionAsOfTimestamp || 0;
		return (data.positionAsOfTimestamp || 0) + (Date.now() - (data.timestamp || Date.now()));
	}

	// Edge glow's pulse state (always active — this effect isn't gated on
	// Now Playing View's cover art existing).
	let edgeGlowSmoothed = 1;
	let lastWrittenEdgeGlow = "";

	let lastRectKey = "";
	let lastWrittenBrightness = "";
	let lastEffectiveCoverUrl = "";
	let wavelinkOwnsBackground = false;
	let wavelinkOwnsAccentColor = false;
	let lastWlAccentUrl = null;

	// Single combined loop for both effects. They used to be two separate
	// requestAnimationFrame loops, each independently calling
	// getComputedStyle() and writing to the DOM — when both ran at once,
	// their reads/writes interleaved within the same frame, forcing the
	// browser to recalculate style more than once per frame ("layout
	// thrashing"). One shared read + one shared write pass per frame fixes
	// that regardless of how many effects are active at once.
	function masterLoop() {
		const rootStyle = getComputedStyle(document.documentElement);
		// Spicetify.Player.data.isPaused reflects Spotify's OWN player —
		// Spotify has no idea Wavelink is playing a SoundCloud track, so
		// that flag stays true the whole time and silently gates off all
		// reactive glow logic below. While Wavelink actually owns playback
		// (sc-active), trust the real <audio id="wavelink-audio"> element's
		// .paused state instead.
		let isPaused = !!(Spicetify.Player.data && Spicetify.Player.data.isPaused);
		if (document.body.classList.contains("sc-active")) {
			const wlAudioEl = document.getElementById("wavelink-audio");
			isPaused = wlAudioEl ? wlAudioEl.paused : true;
		}
		const posSec = getPrecisePositionMs() / 1000;
		// No real audio-reactive data source exists for Wavelink tracks
		// (see the big comment above getWavelinkRenderedCoverUrl/the old
		// AnalyserNode block) — CORS blocks real analysis, and trying to
		// tap the element's audio graph directly risked killing playback.
		// So both reactive blocks below treat Wavelink playback as
		// unconditionally non-reactive and fall back to static brightness,
		// regardless of the Reactive toggle's setting.
		const scActive = document.body.classList.contains("sc-active");

		// --- Edge glow: cheap, always runs regardless of NPV state ---
		const edgeEnabled = rootStyle.getPropertyValue("--npv-edge-glow-enabled").trim() !== "0";
		const edgeReactive = rootStyle.getPropertyValue("--npv-edge-glow-reactive-enabled").trim() !== "0" && !scActive;
		let edgeTarget = 1;
		if (edgeEnabled && edgeReactive && !isPaused) {
			let norm = 0;
			const punch = getBeatPunch(posSec);
			if (punch !== null) {
				norm = Math.min(punch, 1);
			} else if (audioSegments) {
				const db = getSegmentLoudnessDb(posSec);
				if (db !== null) {
					norm = Math.min(Math.max((db - loudnessFloor) / (loudnessCeil - loudnessFloor), 0), 1);
				}
			}
			const boost = (Number.parseFloat(rootStyle.getPropertyValue("--npv-edge-glow-reactive-boost")) || 200) / 100;
			edgeTarget = 1 + norm * (boost - 1);
		}
		// On pause, position genuinely stops advancing, so target values
		// would converge and settle within a couple frames anyway — this
		// just skips straight to "settled" instead of easing there over
		// ~1-2s, since nothing changes on screen while paused regardless.
		edgeGlowSmoothed += (edgeTarget - edgeGlowSmoothed) * (isPaused ? 1 : 0.15);
		const roundedEdgeGlow = edgeGlowSmoothed.toFixed(2);
		if (roundedEdgeGlow !== lastWrittenEdgeGlow) {
			lastWrittenEdgeGlow = roundedEdgeGlow;
			document.documentElement.style.setProperty("--npv-edge-glow-reactive-brightness", roundedEdgeGlow);
		}

		// --- Cover art ambience glow: only while NPV's cover art exists ---
		const cover = document.querySelector(".main-nowPlayingView-coverArtContainer");
		const masterEnabled = rootStyle.getPropertyValue("--npv-ambience-master-enabled").trim() !== "0";

		if (!cover || !masterEnabled) {
			document.documentElement.style.setProperty("--npv-ambience-opacity", 0);
			detachAmbienceVideo();
			requestAnimationFrame(masterLoop);
			return;
		}

		// Spicetify's own "songchange" event never fires for a Wavelink/
		// SoundCloud track change (Spotify's Player has no idea it happened),
		// so that's not available to re-trigger setImage() here. Cheap
		// enough to just compare the effective URL every frame instead.
		// Wrapped in try/catch: this whole block runs inside the same shared
		// masterLoop as the ambience glow and edge glow — an uncaught error
		// here would silently kill requestAnimationFrame(masterLoop) for
		// everything, not just this feature, which is almost certainly why
		// the reactive animation appeared to stop working entirely.
		try {
			if (document.body.classList.contains("sc-active")) {
				const effectiveUrl = getEffectiveCoverUrl(Spicetify.Player.data.item.metadata);
				if (effectiveUrl !== lastEffectiveCoverUrl) {
					lastEffectiveCoverUrl = effectiveUrl;
					setImage(Spicetify.Player.data.item.metadata);
				}
				// Panel background sync — reuses the app's own existing
				// "ALBUM ART BACKGROUND" mechanism (.Root__top-container::before
				// in user.css, driven by --image_url, normally updated by
				// onSongChange()) instead of a separate element. That existing
				// layer is already correctly positioned/blurred/layered behind
				// everything — Wavelink track changes just never triggered its
				// update before, since they don't fire Spicetify's songchange.
				// Uses getWavelinkRenderedCoverUrl() directly (not
				// getEffectiveCoverUrl()) so this stays independent of the
				// Cover art sync toggle — turning that off shouldn't also
				// silently break this separate feature.
				if (document.body.classList.contains("__cleanest_compat_wavelink_bgsync")) {
					const bgUrl = getWavelinkRenderedCoverUrl();
					if (bgUrl) {
						document.documentElement.style.setProperty("--image_url", `url("${bgUrl}")`);
						wavelinkOwnsBackground = true;
					}
				} else if (wavelinkOwnsBackground) {
					restoreSpotifyBackground();
					wavelinkOwnsBackground = false;
				}

				// Accent color sync — same idea as background sync above:
				// recolor everything that reads --spice-accent/--spice-button/
				// --spice-button-active (liked-songs heart, buttons, edge glow,
				// etc.) to match the actual Wavelink/SoundCloud cover instead of
				// staying stuck on whatever Spotify track played last.
				if (document.body.classList.contains("__cleanest_compat_wavelink_accent")) {
					const accentUrl = getWavelinkRenderedCoverUrl();
					if (accentUrl && accentUrl !== lastWlAccentUrl) {
						lastWlAccentUrl = accentUrl;
						extractDominantColor(accentUrl, setAccentColorVars);
						wavelinkOwnsAccentColor = true;
					}
				} else if (wavelinkOwnsAccentColor) {
					restoreSpotifyAccentColor();
					wavelinkOwnsAccentColor = false;
					lastWlAccentUrl = null;
				}
			} else if (wavelinkOwnsBackground) {
				// Playback handed back to Spotify — restore the normal
				// track-driven background instead of leaving Wavelink's last
				// cover stuck there.
				restoreSpotifyBackground();
				wavelinkOwnsBackground = false;
			}
			if (!document.body.classList.contains("sc-active") && wavelinkOwnsAccentColor) {
				restoreSpotifyAccentColor();
				wavelinkOwnsAccentColor = false;
				lastWlAccentUrl = null;
			}
		} catch (err) {
			// Swallow — see comment above. Worst case this feature silently
			// no-ops for a frame instead of taking the whole loop down.
		}

		const baseSpread = Number.parseFloat(rootStyle.getPropertyValue("--npv-ambience-spread")) || AMBIENCE_SPREAD_PX;
		// Reactive ambience is unavailable for Wavelink tracks — see the
		// scActive comment above. Force static brightness during Wavelink
		// playback regardless of the toggle's own setting.
		const reactiveEnabled = rootStyle.getPropertyValue("--npv-ambience-reactive-enabled").trim() !== "0" && !scActive;
		const staticBrightness = (Number.parseFloat(rootStyle.getPropertyValue("--npv-ambience-static-brightness")) || AMBIENCE_STATIC_BRIGHTNESS * 100) / 100;
		const reactiveMin = (Number.parseFloat(rootStyle.getPropertyValue("--npv-ambience-reactive-min")) || AMBIENCE_REACTIVE_MIN * 100) / 100;
		const reactiveMax = (Number.parseFloat(rootStyle.getPropertyValue("--npv-ambience-reactive-max")) || AMBIENCE_REACTIVE_MAX * 100) / 100;
		const reactiveSizeMax = (Number.parseFloat(rootStyle.getPropertyValue("--npv-ambience-reactive-size-max")) || AMBIENCE_REACTIVE_SIZE_MAX * 100) / 100;
		const reactiveSmoothing = Math.min(Math.max((Number.parseFloat(rootStyle.getPropertyValue("--npv-ambience-reactive-smoothing")) || AMBIENCE_REACTIVE_SMOOTHING * 100) / 100, 0.01), 1);
		const sizeSmoothing = Math.max(reactiveSmoothing * 0.6, 0.03);

		let punchNorm = 0;
		if (reactiveEnabled && !isPaused) {
			const punch = getBeatPunch(posSec);
			if (punch !== null) {
				punchNorm = Math.min(punch, 1);
			} else if (audioSegments) {
				const db = getSegmentLoudnessDb(posSec);
				if (db !== null) {
					punchNorm = Math.min(Math.max((db - loudnessFloor) / (loudnessCeil - loudnessFloor), 0), 1);
				}
			}
		}

		const targetBrightness = reactiveEnabled
			? reactiveMin + punchNorm * (reactiveMax - reactiveMin)
			: staticBrightness;
		smoothedBrightness += (targetBrightness - smoothedBrightness) * (isPaused ? 1 : reactiveSmoothing);
		const roundedBrightness = smoothedBrightness.toFixed(2);
		if (roundedBrightness !== lastWrittenBrightness) {
			lastWrittenBrightness = roundedBrightness;
			document.documentElement.style.setProperty("--npv-ambience-reactive-brightness", roundedBrightness);
		}

		const targetSizeMult = 1 + punchNorm * (reactiveSizeMax - 1);
		smoothedSizeMult += (targetSizeMult - smoothedSizeMult) * (isPaused ? 1 : sizeSmoothing);
		const spread = Math.min(Math.max(baseSpread * smoothedSizeMult, 2), 200);

		// Geometry/background writes used to be throttled to ~30fps to save
		// on layout+repaint cost — but that meant the glow visibly lagged
		// half a frame behind the cover art during any fast movement
		// (resizing, scrolling, NPV open/close animations), which looked
		// broken rather than just "slightly less smooth". Running this
		// every frame costs more, but keeps the glow rigidly attached to
		// the cover regardless of how fast it's moving.
		const mediaEl = getCoverMediaEl(cover);
		const rect = mediaEl.getBoundingClientRect();

		// Canvas video ("Switch to video"/looping clip) detection — the
		// only signal used is the tag itself, nothing structural that
		// could vary between Spotify versions.
		const isVideoMode = mediaEl.tagName === "VIDEO";
		_wlDebugLogVideoAmbience(isVideoMode, mediaEl);
		const videoSyncOn = document.body.classList.contains("__cleanest_ambience_video_sync");
		if (isVideoMode && videoSyncOn) {
			ensureAmbienceVideoAttached(mediaEl);
		} else {
			detachAmbienceVideo();
		}
		// With the toggle off, there's no live frame to show and no
		// legitimate cover-art image either (Canvas videos don't have a
		// static image counterpart) — the layer would otherwise keep
		// showing whatever static blurred image was last set (from
		// before the video started), which doesn't match what's on
		// screen. Hiding the glow outright while a video plays without
		// sync enabled avoids ever showing stale/mismatched content next
		// to — or, if the hole-cutout geometry is ever a frame behind on
		// a fast resize, briefly over — the video.
		const hideAmbienceForVideo = isVideoMode && !videoSyncOn;
		const leftOnly = isVideoMode && document.body.classList.contains("__cleanest_ambience_video_leftonly");

		// The sidebar's own overlayscrollbars viewport exposes a `fade`
		// attribute (bottom / full / top) that already tracks exactly
		// whether it's scrolled — "bottom" means resting at the very top
		// (nothing scrolled past yet, cover sits at its normal spot,
		// nowhere near the header), while "full"/"top" mean content has
		// scrolled down, which is when the cover can end up behind the
		// header. Using this directly instead of computing our own
		// visibility/clipping heuristics.
		const viewportEl = document.querySelector(".Root__right-sidebar [data-overlayscrollbars-viewport]");
		const fade = viewportEl ? viewportEl.getAttribute("fade") : null;
		const key = `${rect.top}|${rect.left}|${rect.width}|${rect.height}|${spread.toFixed(1)}|${fade}|${leftOnly}`;
		if (key !== lastRectKey) {
			lastRectKey = key;
			const outerW = rect.width + spread * 2;
			const outerH = rect.height + spread * 2;
			const outerLeft = rect.left - spread;
			const outerTop = rect.top - spread;
			const bgSize = `${outerW}px ${outerH}px`;

			// evenodd: an outer ring (clockwise) plus an inner ring, sharing
			// no points, means only the ring *between* them gets painted —
			// i.e. everything except the cover art's own rectangle.
			// The outer ring is pushed well past the element's own box
			// (not just 0/outerW/outerH) on purpose: clip-path clamps
			// filter bleed too, not just the flat box — with the outer
			// ring sitting exactly on the box edge, the blur's natural
			// outward spill (which is what made the old 4-strip version
			// fade softly into the background) was getting cut off flat,
			// which is what made this version look like a hard-edged
			// frame instead of a soft glow. Padding the outer ring out
			// removes that clamp while the inner hole stays exact.
			// The inner ring is rounded (not a plain rectangle) to match
			// the cover art's own border-radius — otherwise each corner
			// left a small square gap where neither the (rounded) artwork
			// nor the (square-holed) glow painted anything, showing raw
			// dark background through as black corner notches.
			// (Header-scroll clipping used to also live in this same
			// clip-path — combining that with filter: blur() on the same
			// element, recomputed every frame, turned out to be unreliable.
			// It's handled by the wrapper's plain overflow:hidden instead
			// now — see below — so this path only ever does the cover cutout.)
			const pad = Math.max(spread * 4, 200);
			const cornerRadius = getCoverCornerRadius(cover, mediaEl);
			const outerPath = `M${-pad},${-pad} L${outerW + pad},${-pad} L${outerW + pad},${outerH + pad} L${-pad},${outerH + pad} Z`;
			// REVERTED — the shrunk/"fed" hole didn't actually read as a
			// smooth fade (blur softens color, not the cutout's own hard
			// alpha edge — shifting where that edge sits doesn't change
			// that it's still a hard edge). Back to a plain hole matching
			// the cover's rect exactly until there's a properly-working
			// soft-fade technique to try instead.
			const innerPath = roundedRectPathData(spread, spread, rect.width, rect.height, cornerRadius);
			const clipPath = `path(evenodd, "${outerPath} ${innerPath}")`;

			// The wrapper's own box is the actual clip boundary now (plain
			// overflow: hidden, no path syntax involved). Generously huge
			// by default so it never restricts anything; its top edge only
			// gets pulled down to the header's bottom edge when fade says
			// content is scrolled.
			const FAR = 100000;
			let wrapperTop = -FAR;
			const header = document.querySelector(".Root__right-sidebar .main-nowPlayingView-headerContainer");
			if (fade === "full" || fade === "top") {
				if (header) {
					wrapperTop = header.getBoundingClientRect().bottom;
				}
			}
			// The above only kicked in once the sidebar had actually been
			// scrolled — at rest (fade === "bottom", the normal state right
			// after opening Now Playing) wrapperTop stayed at -FAR, so
			// nothing stopped the ring's blur from bleeding all the way up
			// past the header, past the playlist title, right up to the
			// window's own title bar. Clamping unconditionally (regardless
			// of scroll state) crops that off directly. Uses the header's
			// own top edge, not the sidebar element's — the sidebar's outer
			// box turned out to extend a bit higher than where its visible
			// content (the header/title) actually starts, so clamping to
			// the sidebar itself still let a sliver bleed through.
			if (header) {
				wrapperTop = Math.max(wrapperTop, header.getBoundingClientRect().top);
			}
			let wrapperBottom = FAR; // unbounded downward by default
			// Extra padding above/below the video for the "left only"
			// strip, and — reused below — how tall the top cap of the
			// L-shape is.
			const leftOnlyVPad = Math.max(spread * 2, 60);
			// Even with the crop boundary landing exactly on the video's
			// own edge, a thin sliver of color still showed right at that
			// line — not a geometry bug, just an inherent side effect of
			// blurring right up to a hard clip: blur smears nearby bright
			// pixels outward, and clipping cuts the canvas but can't un-
			// blur what's already bled toward the edge. Pulling the crop
			// boundary inward by roughly the blur radius means that smear
			// happens within the already-hidden region instead of right at
			// the visible edge.
			const blurPx = Number.parseFloat(rootStyle.getPropertyValue("--npv-ambience-blur")) || AMBIENCE_BLUR_PX;
			if (leftOnly) {
				// Without this, the wrapper's height stayed FAR*2 (basically
				// the whole viewport) even after the width got cropped to
				// the left sliver — so the visible strip stretched from the
				// very top of the screen to the very bottom instead of just
				// sitting alongside the video. Cap top/bottom to roughly the
				// video's own vertical span so the strip only runs alongside
				// it.
				wrapperTop = Math.max(wrapperTop, rect.top - leftOnlyVPad);
				wrapperBottom = Math.min(wrapperBottom, rect.top + rect.height - blurPx / 2);
			} else if (isVideoMode) {
				// Regular ring mode, but still Canvas video. Bottom: flush
				// with the video's own bottom edge, no extra padding — the
				// ring used to bleed glow below the video indefinitely
				// (wrapperBottom left at FAR, effectively unbounded), which
				// wasn't wanted there. Top: also tightened to roughly the
				// ring's own natural extent (`pad`, the same blur-bleed
				// margin the ring's own outerPath already uses) instead of
				// staying way up near the header — without this, the top
				// fade (a fixed 40px measured from wrapperTop) ended up
				// happening in empty space up near the header/title, nowhere
				// near where the ring actually becomes visible around the
				// video, so it didn't look like it was doing anything.
				// Static covers (the plain `else` case, not video) get
				// neither of these — that ring stays full and symmetric
				// like it always has; both of these crops were only ever
				// meant for video.
				wrapperTop = Math.max(wrapperTop, rect.top - pad);
				wrapperBottom = Math.min(wrapperBottom, rect.top + rect.height - blurPx / 2);
			}
			const wrapperHeight = wrapperBottom - wrapperTop;
			// Normally the wrapper sits enormously far off to the left
			// (-FAR) and is FAR*2 wide — effectively unbounded, since the
			// ring's own clip-path already does the real shaping and
			// nothing needs cropping. "Left side only" instead sizes the
			// wrapper to a normal, sane rectangle (screen x: 0 to roughly
			// the cover's left edge) instead of that huge FAR-based span —
			// needed so the L-shape polygon below can use plain, readable
			// pixel coordinates relative to the wrapper's own box, rather
			// than having to offset everything by FAR.
			const wrapperLeft = leftOnly ? 0 : -FAR;
			// REVERTED — see the ring's clipPath comment above; same
			// ineffective feather idea, same revert.
			const stripWidth = Math.max(rect.left, 0);
			// The L's top cap: a horizontal bar that extends further right
			// than the plain vertical strip, sitting in the padding gap
			// directly above the video (the same leftOnlyVPad space the
			// strip already overshoots into) — this is the "additional
			// glow along the top edge" that was asked for, turning the
			// strip's top from a flat cutoff into an actual corner piece
			// that visually wraps around the video instead of just
			// stopping. Reaches about a third of the way across the video
			// itself, capped so it never runs past the video's own right
			// edge.
			const topCapHeight = leftOnlyVPad;
			const topCapWidth = leftOnly
				? Math.min(stripWidth + Math.max(rect.width * 0.35, 80), rect.left + rect.width)
				: stripWidth;
			const wrapperWidth = leftOnly ? Math.max(topCapWidth - wrapperLeft, 0) : FAR * 2;
			// Plain overflow: hidden only crops to a rectangle — an L shape
			// needs clip-path instead. Traces across the top to topCapWidth,
			// down to topCapHeight, back in to stripWidth (narrowing to the
			// vertical strip, with a smoothed S-curve at that narrowing —
			// see leftOnlyClipPathData above), down to the bottom, then
			// across and back up the left edge to close. Coordinates are
			// relative to the wrapper's own box, which is why
			// wrapperLeft/wrapperTop got switched to sane values above
			// instead of staying FAR-offset.
			const leftOnlyClip = leftOnly
				? `path("${leftOnlyClipPathData(topCapWidth, topCapHeight, stripWidth, wrapperHeight)}")`
				: "none";
			// The hard top clamp added just now (wrapperTop pinned to the
			// header's own edge) cuts the glow off instantly right at that
			// line — same idea as Spotify's own video mask-image (confirmed
			// working in this build via DevTools: a plain CSS
			// linear-gradient, no SVG involved) that fades the video's own
			// top/bottom edges instead of a hard cut. Doing the same thing
			// here — a simple gradient mask on the wrapper — turns that
			// instant cutoff into a soft appear instead, so it matches how
			// the video itself already fades in at the same edge. Pixel-
			// based stops (not %) since the non-leftOnly wrapper's own
			// height is enormous (FAR-based) — a percentage of that would
			// be imperceptibly thin.
			const TOP_FADE_PX = 40;
			// Bottom fade failed several different ways as a SINGLE
			// gradient (extra stops tacked onto the same gradient, a
			// blurred SVG mask, a separate overlay element) — but the
			// simple top fade (a plain 2-stop gradient, on its own) always
			// worked fine. Rather than trying to cram both fades into one
			// gradient again, this layers TWO separate copies of that same
			// proven 2-stop shape — one fading in from the top, one fading
			// in from the bottom — and combines them with mask-composite:
			// intersect, which keeps only the pixels both layers agree are
			// visible. Near either edge, whichever gradient is more
			// transparent there wins; in the middle, both report fully
			// opaque, so nothing changes there.
			const wrapperMask = `linear-gradient(to bottom, transparent 0px, black ${TOP_FADE_PX}px), `
				+ `linear-gradient(to top, transparent 0px, black ${TOP_FADE_PX}px)`;

			for (const layer of allLayers) {
				layer.wrapper.style.top = `${wrapperTop}px`;
				layer.wrapper.style.left = `${wrapperLeft}px`;
				layer.wrapper.style.width = `${wrapperWidth}px`;
				layer.wrapper.style.height = `${wrapperHeight}px`;
				layer.wrapper.style.maskImage = wrapperMask;
				layer.wrapper.style.webkitMaskImage = wrapperMask;
				layer.wrapper.style.maskSize = "100% 100%";
				layer.wrapper.style.webkitMaskSize = "100% 100%";
				layer.wrapper.style.maskRepeat = "no-repeat";
				layer.wrapper.style.webkitMaskRepeat = "no-repeat";
				layer.wrapper.style.maskComposite = "intersect";
				layer.wrapper.style.webkitMaskComposite = "source-in";
				layer.wrapper.style.clipPath = leftOnlyClip;
				layer.wrapper.style.webkitClipPath = leftOnlyClip;
				// el's position is relative to the wrapper now (position:
				// absolute inside a position:fixed wrapper), so it has to be
				// expressed as an offset from the wrapper's own top-left,
				// not raw viewport coordinates.
				layer.el.style.top = `${outerTop - wrapperTop}px`;
				layer.el.style.left = `${outerLeft - wrapperLeft}px`;
				layer.el.style.width = `${outerW}px`;
				layer.el.style.height = `${outerH}px`;
				layer.el.style.backgroundSize = bgSize;
				layer.el.style.backgroundPosition = "0px 0px";
				layer.el.style.clipPath = clipPath;
			}
		}
		document.documentElement.style.setProperty("--npv-ambience-opacity", rect.width > 0 && !hideAmbienceForVideo ? 1 : 0);

		requestAnimationFrame(masterLoop);
	}

	// Initialization
	setImage(Spicetify.Player.data.item.metadata);
	loadAudioAnalysis();
	requestAnimationFrame(masterLoop);

	// Event Listeners
	Spicetify.Player.addEventListener("songchange", e => {
		setImage(e.data.item.metadata);
		loadAudioAnalysis();
	});
})();
