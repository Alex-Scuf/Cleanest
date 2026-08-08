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
      name: "Ambience reacts to music loudness",
      defVal: true,
      group: "ambience",
      animated: true,
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
      name: "Edge glow reacts to music loudness",
      defVal: true,
      group: "edgeglow",
      animated: true,
    },
  ];
  const toggles = {
    UseCustomBackground: false,
    UseCustomColor: false,
    HideNowPlayingSidebar: false,
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

    onSongChange();
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
      if (group && !master) toggleRow.classList.add(`cleanest-${group}-dependent`);
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
      .filter((opt) => opt.group === "ambience" && opt.animated)
      .forEach((opt) => createToggle(opt, ambienceColumn));
    sliders
      .filter((opt) => opt.group === "ambience" && opt.animated)
      .forEach((opt) => createSlider(opt, ambienceColumn));

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
		body.__cleanest_hide_switchtovideo [class="main-nowPlayingView-actionButtonContainer"] {
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
		body.__cleanest_hide_queue [aria-label="Queue"],
		body.__cleanest_hide_queue button:has([aria-label="Queue"]) {
			display: none !important;
		}
		body.__cleanest_hide_connectdevice [aria-label="Connect to a device"],
		body.__cleanest_hide_connectdevice button:has([aria-label="Connect to a device"]) {
			display: none !important;
		}
		body.__cleanest_hide_whatsnew [aria-label="What's New"],
		body.__cleanest_hide_whatsnew button:has([aria-label="What's New"]) {
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
		.cleanestSubHeader {
			font-size: 0.75rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			opacity: 0.6;
			margin-top: 4px;
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
			gap: 18px;
			align-items: flex-start;
			margin-top: 4px;
		}
		.cleanestSettingsColumn {
			flex: 0 1 auto;
			min-width: 0;
			max-width: 320px;
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
		/* Modal title. Two earlier attempts using flex:1 + width:100% broke
		   the close button's clickable area — likely because forcing the
		   title to grow via flex pushed/resized it as a flex sibling of the
		   close button. This time: plain text-align only, no flex, no width,
		   no position change — if the title is normal block-level content
		   (not itself a flex item), this centers the text without being
		   able to affect any sibling's box at all. */
		/* Confirmed via DevTools: title is an <h2> inside
		   .main-trackCreditsModal-header, sitting in a flex row alongside
		   the close button. Last attempt's width:100% is what broke the
		   close button — forcing full parent width ignores the flex
		   algorithm's own space allocation and let the box extend over the
		   button. flex:1 alone respects sibling space properly. */
		div[aria-label="Cleanest Settings"] .main-trackCreditsModal-header h2 {
			flex: 1;
			text-align: center;
			pointer-events: none;
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

		/* Real elements attached to <body> (not inside the sidebar's DOM
		   tree), so the sidebar's own overflow clipping can't cut off the
		   glow at its edge. Position/size is synced to the cover art via JS. */
		.npv-ambience-glow-layer {
			content: "";
			position: fixed;
			pointer-events: none;
			background-position: center;
			background-size: cover;
			background-repeat: no-repeat;
			transition: background 0.5s ease, opacity 0.5s ease;
			opacity: var(--npv-ambience-opacity, 0);
			z-index: 9999;
		}

		/* Single blurred/tinted layer per side (not stacked) — simple,
		   direct, and known to actually show visible color. */
		.npv-ambience-glow-layer--tint {
			filter: blur(var(--npv-ambience-blur)) saturate(2.3) contrast(1.6) brightness(var(--npv-ambience-reactive-brightness, 1));
		}

		/* compatibility: since spotify 1.2.87; spicetify v2.42.2 */
		.Root__right-sidebar aside .main-nowPlayingView-headerContainer {
			position: absolute;
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

	const SIDES = ["top", "bottom", "left", "right"];

	// Create 4 thin "frame" strips per filter layer (top/bottom/left/right),
	// attached directly to <body>. Because each strip only ever occupies the
	// margin area around the cover art — never the cover art's own
	// rectangle — it's safe to keep them at a high z-index (always drawn on
	// top) without ever actually covering the artwork itself, sidestepping
	// the app's unpredictable internal stacking order entirely.
	function makeLayerSet(modifierClass) {
		const set = {};
		for (const side of SIDES) {
			const el = document.createElement("div");
			el.className = `npv-ambience-glow-layer ${modifierClass} npv-ambience-glow-layer--side-${side}`;
			document.body.appendChild(el);
			set[side] = el;
		}
		return set;
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

	function setImage(metadata) {
		// Using the full-res image here on purpose: at larger Spread values
		// the source gets stretched over a much bigger virtual canvas (see
		// the "windowing" technique in syncPosition below) before being
		// blurred — a smaller source image stretched that far washes out
		// into a flat, textureless smear instead of a soft colorful glow.
		const url = metadata.image_xlarge_url || metadata.image_large_url || metadata.image_url;
		const bg = `url(${url})`;
		for (const layerSet of allLayers) {
			for (const side of SIDES) {
				layerSet[side].style.backgroundImage = bg;
			}
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
	let frameCounter = 0;

	// Single combined loop for both effects. They used to be two separate
	// requestAnimationFrame loops, each independently calling
	// getComputedStyle() and writing to the DOM — when both ran at once,
	// their reads/writes interleaved within the same frame, forcing the
	// browser to recalculate style more than once per frame ("layout
	// thrashing"). One shared read + one shared write pass per frame fixes
	// that regardless of how many effects are active at once.
	function masterLoop() {
		const rootStyle = getComputedStyle(document.documentElement);
		const isPaused = !!(Spicetify.Player.data && Spicetify.Player.data.isPaused);
		const posSec = getPrecisePositionMs() / 1000;

		// --- Edge glow: cheap, always runs regardless of NPV state ---
		const edgeEnabled = rootStyle.getPropertyValue("--npv-edge-glow-enabled").trim() !== "0";
		const edgeReactive = rootStyle.getPropertyValue("--npv-edge-glow-reactive-enabled").trim() !== "0";
		let edgeTarget = 1;
		if (edgeEnabled && edgeReactive && !isPaused) {
			const punch = getBeatPunch(posSec);
			let norm = 0;
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
			requestAnimationFrame(masterLoop);
			return;
		}

		const baseSpread = Number.parseFloat(rootStyle.getPropertyValue("--npv-ambience-spread")) || AMBIENCE_SPREAD_PX;
		const reactiveEnabled = rootStyle.getPropertyValue("--npv-ambience-reactive-enabled").trim() !== "0";
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

		// Geometry/background writes stay throttled to ~30fps — still the
		// expensive part (layout + repainting several blurred elements).
		frameCounter++;
		if (frameCounter % 2 !== 0) {
			requestAnimationFrame(masterLoop);
			return;
		}

		const rect = cover.getBoundingClientRect();
		const key = `${rect.top}|${rect.left}|${rect.width}|${rect.height}|${spread.toFixed(1)}`;
		if (key !== lastRectKey) {
			lastRectKey = key;
			const outerW = rect.width + spread * 2;
			const outerH = rect.height + spread * 2;
			const outerLeft = rect.left - spread;
			const outerTop = rect.top - spread;
			const bgSize = `${outerW}px ${outerH}px`;

			const bands = {
				top:    { left: outerLeft, top: outerTop, width: outerW, height: spread, bgX: 0, bgY: 0 },
				bottom: { left: outerLeft, top: rect.bottom, width: outerW, height: spread, bgX: 0, bgY: -(outerH - spread) },
				left:   { left: outerLeft, top: rect.top, width: spread, height: rect.height, bgX: 0, bgY: -spread },
				right:  { left: rect.right, top: rect.top, width: spread, height: rect.height, bgX: -(outerW - spread), bgY: -spread },
			};

			for (const layerSet of allLayers) {
				for (const side of SIDES) {
					const b = bands[side];
					const el = layerSet[side];
					el.style.top = `${b.top}px`;
					el.style.left = `${b.left}px`;
					el.style.width = `${b.width}px`;
					el.style.height = `${b.height}px`;
					el.style.backgroundSize = bgSize;
					el.style.backgroundPosition = `${b.bgX}px ${b.bgY}px`;
				}
			}
		}
		document.documentElement.style.setProperty("--npv-ambience-opacity", rect.width > 0 ? 1 : 0);

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
