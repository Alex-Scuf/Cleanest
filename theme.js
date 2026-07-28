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
    },
    {
      id: "UseCustomColor",
      name: "Custom color",
      defVal: false,
    },
    {
      id: "HideNowPlayingSidebar",
      name: "Hide now playing sidebar",
      defVal: false,
    },
  ];
  const toggles = {
    UseCustomBackground: false,
    UseCustomColor: false,
    HideNowPlayingSidebar: false
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
    },
    { id: "cont", name: "Contrast", min: 0, max: 200, step: 2, defVal: 50 },
    { id: "satu", name: "Saturation", min: 0, max: 200, step: 2, defVal: 70 },
    {
      id: "bright",
      name: "Brightness",
      min: 0,
      max: 200,
      step: 2,
      defVal: 120,
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

      img.src = getCurrentBackground(true);
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
          const lyric = document.querySelector(
            ".lyrics-lyricsContent-lyric"
          )[2];
          document.documentElement.style.setProperty(
            "--lyrics-text-direction",
            /[\u0591-\u07FF]/.test(lyric.innerText) ? "right" : "left"
          );

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

    function createToggle(opt) {
      let { id, name, defVal } = opt;
      const toggleRow = document.createElement("div");
      toggleRow.classList.add("cleanestOptionRow");
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
        .addEventListener("click", () =>
          toggleRow.querySelector(".toggle").classList.toggle("enabled")
        );
      const isEnabled = JSON.parse(localStorage.getItem(id)) ?? defVal;
      toggleRow.querySelector(".toggle").classList.toggle("enabled", isEnabled);
      content.append(toggleRow);
    }

    function createSlider(opt) {
      let { id, name, min, max, step, defVal, end } = opt;
      const val = localStorage.getItem(`${id}Amount`) || defVal;
      const slider = document.createElement("div");
      slider.classList.add("cleanestOptionRow");
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
      content.append(slider);
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

    toggleInfo.forEach(createToggle);

    // Additional settings (added by lily)
    const colorRow = document.createElement("div");
    colorRow.classList.add("cleanestOptionRow");

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
    content.append(colorRow);

    sliders.forEach(createSlider);
    loadSliders();

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

// Append Styling To Head
(function initStyle() {
	const style = document.createElement("style");
	style.textContent = `
		:root {
			--npv-ambience-spread: ${AMBIENCE_SPREAD_PX}px;
			--npv-ambience-blur: ${AMBIENCE_BLUR_PX}px;
		}

		/* Real elements attached to <body> (not inside the sidebar's DOM
		   tree), so the sidebar's own overflow clipping can't cut off the
		   glow at its edge. Position/size is synced to the cover art via JS. */
		.npv-ambience-glow-layer {
			content: "";
			position: fixed;
			pointer-events: none;
			background-repeat: no-repeat;
			transition: background 0.5s ease, opacity 0.5s ease;
			opacity: var(--npv-ambience-opacity, 0);
			z-index: 9999;
			will-change: top, left, width, height, background-position;
		}

		.npv-ambience-glow-layer--saturate {
			filter: blur(var(--npv-ambience-blur)) saturate(2);
		}

		.npv-ambience-glow-layer--contrast {
			filter: blur(var(--npv-ambience-blur)) contrast(2);
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
			el.className = `npv-ambience-glow-layer ${modifierClass}`;
			document.body.appendChild(el);
			set[side] = el;
		}
		return set;
	}

	const saturateLayers = makeLayerSet("npv-ambience-glow-layer--saturate");
	const contrastLayers = makeLayerSet("npv-ambience-glow-layer--contrast");
	const allLayers = [saturateLayers, contrastLayers];

	function setImage(url) {
		const bg = `url(${url})`;
		for (const layerSet of allLayers) {
			for (const side of SIDES) {
				layerSet[side].style.backgroundImage = bg;
			}
		}
	}

	// Keep each strip locked to the cover art's on-screen position/size
	// every frame, so it tracks scrolling/resizing/collapsing.
	let lastRectKey = "";
	function syncPosition() {
		const cover = document.querySelector(".main-nowPlayingView-coverArtContainer");
		if (cover) {
			const rect = cover.getBoundingClientRect();
			const spread = AMBIENCE_SPREAD_PX;
			const key = `${rect.top}|${rect.left}|${rect.width}|${rect.height}`;
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
		} else {
			document.documentElement.style.setProperty("--npv-ambience-opacity", 0);
		}
		requestAnimationFrame(syncPosition);
	}

	// Initialization
	setImage(Spicetify.Player.data.item.metadata.image_xlarge_url);
	requestAnimationFrame(syncPosition);

	// Event Listeners
	Spicetify.Player.addEventListener("songchange", e => {
		const preloadImage = new Image();
		preloadImage.src = e.data.item.metadata.image_xlarge_url;
		preloadImage.onload = () => {
			setImage(preloadImage.src);
		};
	});
})();
