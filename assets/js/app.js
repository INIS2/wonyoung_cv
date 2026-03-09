(function () {
  "use strict";

  var rootPath = "./";
  var app = document.getElementById("app");
  var treeControls = document.getElementById("tree-controls");
  var sourceTitle = document.getElementById("source-title");
  var sourceSubtitle = document.getElementById("source-subtitle");
  var sourceView = document.getElementById("source-view");
  var shareUrlOutput = document.getElementById("share-url-output");
  var sharePasswordRow = document.getElementById("share-password-row");
  var includePasswordToggle = document.getElementById("include-password-toggle");
  var showAllAction = document.getElementById("show-all-action");
  var collapseAllAction = document.getElementById("collapse-all-action");
  var copyFilterLinkAction = document.getElementById("copy-filter-link-action");
  var closeFiltersAction = document.getElementById("close-filters-action");
  var filterDrawer = document.getElementById("filter-drawer");
  var filterBackdrop = document.getElementById("filter-backdrop");
  var langKoButton = document.getElementById("lang-ko");
  var langEnButton = document.getElementById("lang-en");
  var shareButton = document.getElementById("share-action");
  var printButton = document.getElementById("print-action");
  var settingsButton = document.getElementById("settings-action");
  var langToggle = document.getElementById("lang-toggle-group");
  var controlTitle = document.getElementById("control-title");
  var controlHint = document.getElementById("control-hint");

  var uiText = {
    about: { ko: "소개", en: "About" },
    loadError: { ko: "이력서 데이터를 불러오지 못했습니다.", en: "Failed to load resume data" },
    treeTitle: { ko: "트리 필터", en: "Tree Filter" },
    treeHint: {
      ko: "JSON 트리에서 원하는 노드를 켜고 끄면 이력서가 바로 반영됩니다.",
      en: "Toggle any node from the JSON tree and the CV preview updates immediately."
    },
    sourceNode: { ko: "원본 JSON 노드", en: "Original JSON node" },
    sourceFull: { ko: "전체 원본", en: "Full source" },
    showAll: { ko: "전체 표시", en: "Show All" },
    collapseAll: { ko: "접기", en: "Collapse All" },
    copyFilterLink: { ko: "필터 링크 복사", en: "Copy Filter Link" },
    filterLinkCopied: { ko: "필터 링크가 복사되었습니다.", en: "Filter link copied." },
    zipPromptResume: { ko: "보호된 이력서를 열기 위한 비밀번호를 입력하세요.", en: "Enter the password to open the protected resume." },
    zipPromptFilter: { ko: "필터 기능을 열기 위한 비밀번호를 입력하세요.", en: "Enter the password to open the protected filter." },
    zipCancelled: { ko: "비밀번호 입력이 취소되었습니다.", en: "Password entry was cancelled." },
    zipInvalid: { ko: "비밀번호가 올바르지 않습니다.", en: "The password is incorrect." },
    zipMissing: { ko: "ZIP 안에서 필요한 파일을 찾지 못했습니다.", en: "The required file was not found in the ZIP archive." },
    copied: { ko: "현재 URL이 복사되었습니다.", en: "Current URL copied." },
    copyFailed: { ko: "URL 복사에 실패했습니다.", en: "Failed to copy URL." },
    filterUnavailable: { ko: "필터 기능을 불러오지 못했습니다.", en: "Filter feature is unavailable." },
    profilePhotoAlt: { ko: "프로필 사진", en: "Profile photo" }
  };

  var state = {
    originalData: null,
    lang: "en",
    drawerOpen: false,
    filter: null,
    filterLoadPromise: null,
    activeSource: "",
    activeSourcePassword: ""
  };

  function parseList(raw) {
    if (!raw) return [];
    return raw
      .replace(/\+/g, " ")
      .split(/[,\s]+/)
      .map(function (value) { return value.trim(); })
      .filter(Boolean);
  }

  function pickText(value, lang) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.en || value.ko || "";
  }

  function getParams() {
    var qs = new URLSearchParams(location.search);
    return {
      lang: (qs.get("lang") || "").toLowerCase(),
      name: qs.get("name") || "",
      source: (qs.get("source") || "").trim(),
      pw: qs.get("pw") || "",
      show: parseList(qs.get("show")),
      edu: parseList(qs.get("edu")),
      hide: parseList(qs.get("hide"))
    };
  }

  function sanitizeSourceName(source) {
    var normalized = String(source || "").trim();
    if (!normalized) return "";
    if (!/^[A-Za-z0-9_.-]+$/.test(normalized)) {
      throw new Error("Invalid source file name.");
    }
    return normalized;
  }

  function chooseLang(data, params) {
    if (params.lang === "ko" || params.lang === "en") return params.lang;
    return data.meta && data.meta.defaultLang ? data.meta.defaultLang : "en";
  }

  function getContactByLabel(data, label) {
    var contacts = (data.profile && data.profile.contacts) || [];
    var found = contacts.find(function (item) {
      return (item.label || "").toLowerCase() === label.toLowerCase();
    });
    return found ? found.value : "";
  }

  function createHeader(data, lang, params) {
    var profile = data.profile || {};
    var header = document.createElement("section");
    header.className = "cv-header";
    var displayName = params.name || pickText(profile.name, lang);
    var roleLine = [pickText(profile.title, lang), pickText(profile.location, lang)].filter(Boolean).join(" ");

    header.innerHTML =
      "<div class=\"cv-header-row\">" +
      "<img class=\"photo\" src=\"" + (profile.photo || "") + "\" alt=\"" + pickText(uiText.profilePhotoAlt, lang) + "\">" +
      "<div class=\"cv-header-main\">" +
      "<h1 class=\"cv-name\">" + displayName + "</h1>" +
      "<p class=\"cv-roleline\">" + roleLine + "</p>" +
      "<p class=\"cv-email\">" + getContactByLabel(data, "email") + "</p>" +
      "</div>" +
      "</div>";
    return header;
  }

  function createAbout(data, lang) {
    var section = document.createElement("section");
    section.className = "cv-section";
    section.innerHTML =
      "<h2 class=\"cv-section-title\">" + pickText(uiText.about, lang) + "</h2>" +
      "<p class=\"cv-about\">" + pickText(data.profile.summary, lang) + "</p>";
    return section;
  }

  function shouldIncludeSection(section, params) {
    if (!params.show.length) return true;
    return params.show.indexOf(section.key) !== -1;
  }

  function shouldIncludeEducationItem(item, params) {
    if (!params.edu.length) return true;
    return params.edu.indexOf(item.level || "") !== -1;
  }

  function createTitleElement(item, lang) {
    var title = pickText(item.title, lang);
    if (!item.url) {
      var plain = document.createElement("h3");
      plain.className = "cv-item-title";
      plain.textContent = title;
      return plain;
    }

    var linked = document.createElement("h3");
    linked.className = "cv-item-title";
    linked.innerHTML =
      "<a class=\"cv-link\" href=\"" + item.url + "\" target=\"_blank\" rel=\"noopener\">" +
      title + " <span class=\"cv-link-icon\">^</span></a>";
    return linked;
  }

  function renderSections(data, lang, params) {
    var wrap = document.createElement("section");

    (data.sections || []).forEach(function (section) {
      if (!section || !shouldIncludeSection(section, params)) return;

      var items = (section.items || []).filter(function (item) {
        if (section.key === "education") return shouldIncludeEducationItem(item, params);
        return true;
      });

      if (!items.length) return;

      var sectionEl = document.createElement("section");
      sectionEl.className = "cv-section";
      sectionEl.innerHTML = "<h2 class=\"cv-section-title\">" + pickText(section.title, lang) + "</h2>";

      items.forEach(function (item) {
        var node = document.createElement("article");
        node.className = "cv-item";
        node.innerHTML =
          "<div class=\"cv-item-top\"><p class=\"cv-item-loc\"></p></div>" +
          "<div class=\"cv-item-subrow\"><p class=\"cv-item-sub\"></p><p class=\"cv-item-period\"></p></div>" +
          "<ul class=\"cv-bullets\"></ul>";

        var top = node.querySelector(".cv-item-top");
        top.insertBefore(createTitleElement(item, lang), top.firstChild);
        node.querySelector(".cv-item-loc").textContent = pickText(item.location, lang);
        node.querySelector(".cv-item-sub").textContent = pickText(item.subTitle, lang);
        node.querySelector(".cv-item-period").textContent = item.period || "";

        var bullets = item.bullets && (item.bullets[lang] || item.bullets.en || item.bullets.ko || []);
        var list = node.querySelector(".cv-bullets");
        if (!bullets.length) {
          list.style.display = "none";
        } else {
          bullets.forEach(function (line) {
            var li = document.createElement("li");
            li.textContent = line;
            list.appendChild(li);
          });
        }

        sectionEl.appendChild(node);
      });

      wrap.appendChild(sectionEl);
    });

    return wrap;
  }

  function setDrawerOpen(nextOpen) {
    if (!state.filter) return;
    state.drawerOpen = nextOpen;
    filterDrawer.classList.toggle("is-open", nextOpen);
    filterDrawer.setAttribute("aria-hidden", nextOpen ? "false" : "true");
    filterBackdrop.hidden = !nextOpen;
    settingsButton.setAttribute("aria-expanded", nextOpen ? "true" : "false");
  }

  function updateLangButton(lang) {
    langKoButton.classList.toggle("is-active", lang === "ko");
    langEnButton.classList.toggle("is-active", lang === "en");

    langKoButton.onclick = function () {
      var url = new URL(location.href);
      url.searchParams.set("lang", "ko");
      location.href = url.toString();
    };

    langEnButton.onclick = function () {
      var url = new URL(location.href);
      url.searchParams.set("lang", "en");
      location.href = url.toString();
    };
  }

  function updateTooltips(lang) {
    var isKo = lang === "ko";
    langToggle.setAttribute("data-tooltip", isKo ? "언어" : "Language");
    shareButton.setAttribute("data-tooltip", isKo ? "공유" : "Share");
    printButton.setAttribute("data-tooltip", isKo ? "인쇄" : "Print");
    settingsButton.setAttribute(
      "data-tooltip",
      state.filter ? (isKo ? "필터" : "Filters") : pickText(uiText.filterUnavailable, lang)
    );
    controlTitle.textContent = pickText(uiText.treeTitle, lang);
    controlHint.textContent = pickText(uiText.treeHint, lang);
    showAllAction.textContent = pickText(uiText.showAll, lang);
    collapseAllAction.textContent = pickText(uiText.collapseAll, lang);
    if (copyFilterLinkAction) {
      copyFilterLinkAction.textContent = pickText(uiText.copyFilterLink, lang);
    }
  }

  function render(data) {
    var params = getParams();
    var lang = chooseLang(data, params);
    var filteredData = state.filter ? state.filter.filterDataByVisibility(data, "") : data;

    state.lang = lang;
    document.documentElement.lang = lang;
    app.innerHTML = "";

    var paper = document.createElement("div");
    paper.className = "cv-paper";
    paper.appendChild(createHeader(filteredData || {}, lang, params));
    paper.appendChild(createAbout(filteredData || {}, lang));
    paper.appendChild(renderSections(filteredData || {}, lang, params));
    app.appendChild(paper);

    updateLangButton(lang);
    updateTooltips(lang);

    if (state.filter) {
      state.filter.setLanguage(lang);
      state.filter.setData(data);
      state.filter.setShareContext({
        source: state.activeSource,
        pw: state.activeSourcePassword
      });
      state.filter.renderTree();
    }
  }

  async function fetchJSONFile(path) {
    var response = await fetch(rootPath + path);
    if (!response.ok) throw new Error("Failed to load source: " + path);
    return response.json();
  }

  async function readTextFromProtectedZip(path, initialPassword, pattern, promptText, onPasswordResolved) {
    var zipModule = await import("https://cdn.jsdelivr.net/npm/@zip.js/zip.js@2.7.57/+esm");
    var response = await fetch(rootPath + path);
    if (!response.ok) throw new Error("Failed to load source: " + path);

    var blob = await response.blob();
    var password = initialPassword || "";
    var attempts = 0;

    while (attempts < 3) {
      try {
        var reader = new zipModule.ZipReader(
          new zipModule.BlobReader(blob),
          password ? { password: password } : {}
        );
        var entries = await reader.getEntries();
        var entry = entries.find(function (item) {
          return !item.directory && pattern.test(item.filename);
        });

        if (!entry) {
          await reader.close();
          throw new Error("ZIP_ENTRY_NOT_FOUND");
        }

        var text = await entry.getData(
          new zipModule.TextWriter(),
          password ? { password: password } : {}
        );
        await reader.close();
        if (typeof onPasswordResolved === "function") {
          onPasswordResolved(password || "");
        }
        return text;
      } catch (error) {
        if (String(error && error.message) === "ZIP_ENTRY_NOT_FOUND") {
          throw new Error(pickText(uiText.zipMissing, state.lang));
        }

        attempts += 1;
        password = window.prompt(
          pickText(attempts === 1 ? promptText : uiText.zipInvalid, state.lang),
          ""
        );
        if (password === null) {
          throw new Error(pickText(uiText.zipCancelled, state.lang));
        }
      }
    }

    throw new Error(pickText(uiText.zipInvalid, state.lang));
  }

  async function getDataFromProtectedZip(path, initialPassword) {
    var text = await readTextFromProtectedZip(
      path,
      initialPassword,
      /\.json$/i,
      uiText.zipPromptResume,
      function (resolvedPassword) {
        state.activeSourcePassword = resolvedPassword;
      }
    );
    return JSON.parse(text);
  }

  async function getDataFromSource(params) {
    var sourceName = sanitizeSourceName(params.source);
    var lowerName = sourceName.toLowerCase();
    state.activeSource = sourceName;
    state.activeSourcePassword = params.pw || "";

    if (lowerName.endsWith(".json")) {
      state.activeSourcePassword = "";
      return fetchJSONFile("data/" + sourceName);
    }

    if (lowerName.endsWith(".zip")) {
      return getDataFromProtectedZip("data/" + sourceName, params.pw || "");
    }

    try {
      return await fetchJSONFile("data/" + sourceName + ".json");
    } catch (error) {
      return getDataFromProtectedZip("data/" + sourceName + ".zip", params.pw || "");
    }
  }

  function getData() {
    var params = getParams();
    var local = localStorage.getItem("resumeDataOverride");
    if (local) {
      try {
        return Promise.resolve(JSON.parse(local));
      } catch (error) {
      }
    }

    if (params.source) {
      return getDataFromSource(params);
    }

    state.activeSource = "";
    state.activeSourcePassword = "";
    return fetchJSONFile("data/resume.json");
  }

  function createFilterInstance() {
    state.filter = window.ResumeFilter.create({
      elements: {
        treeControls: treeControls,
        sourceTitle: sourceTitle,
        sourceSubtitle: sourceSubtitle,
        sourceView: sourceView,
        shareUrlOutput: shareUrlOutput,
        sharePasswordRow: sharePasswordRow,
        includePasswordToggle: includePasswordToggle,
        showAllAction: showAllAction,
        collapseAllAction: collapseAllAction,
        copyFilterLinkAction: copyFilterLinkAction
      },
      uiText: uiText,
      pickText: pickText,
      shareContext: {
        source: state.activeSource,
        pw: state.activeSourcePassword
      },
      onVisibilityChange: function (hiddenPaths) {
        state.filter.setHiddenPaths(hiddenPaths);
        render(state.originalData);
      },
      onCopyRequested: function (url) {
        navigator.clipboard.writeText(url)
          .then(function () {
            alert(pickText(uiText.filterLinkCopied, state.lang));
          })
          .catch(function () {
            alert(pickText(uiText.copyFailed, state.lang));
          });
      }
    });

    state.filter.setHiddenPaths(getParams().hide);
    state.filter.setShareContext({
      source: state.activeSource,
      pw: state.activeSourcePassword
    });
    if (state.originalData) {
      state.filter.setLanguage(state.lang);
      state.filter.setData(state.originalData);
    }
  }

  function tryLoadPlainFilterScript() {
    return fetch(rootPath + "assets/js/filter.js", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("FILTER_SCRIPT_NOT_FOUND");
        return response.text();
      })
      .then(function (scriptText) {
        if (!window.ResumeFilter) {
          var script = document.createElement("script");
          script.textContent = scriptText + "\n//# sourceURL=filter.plain.js";
          document.head.appendChild(script);
          script.remove();
        }

        if (!window.ResumeFilter) {
          throw new Error(pickText(uiText.filterUnavailable, state.lang));
        }
      });
  }

  async function ensureFilterModuleLoaded() {
    if (state.filter) return state.filter;
    if (state.filterLoadPromise) return state.filterLoadPromise;

    state.filterLoadPromise = tryLoadPlainFilterScript()
      .catch(function () {
        return readTextFromProtectedZip(
          "assets/js/filter.zip",
          getParams().pw || "",
          /\.js$/i,
          uiText.zipPromptFilter
        ).then(function (scriptText) {
          if (!window.ResumeFilter) {
            var script = document.createElement("script");
            script.textContent = scriptText + "\n//# sourceURL=filter.protected.js";
            document.head.appendChild(script);
            script.remove();
          }

          if (!window.ResumeFilter) {
            throw new Error(pickText(uiText.filterUnavailable, state.lang));
          }
        });
      })
      .then(function () {
        createFilterInstance();
        return state.filter;
      })
      .finally(function () {
        state.filterLoadPromise = null;
      });

    return state.filterLoadPromise;
  }

  function bindTopbarActions() {
    shareButton.onclick = function () {
      navigator.clipboard.writeText(location.href)
        .then(function () {
          alert(pickText(uiText.copied, state.lang));
        })
        .catch(function () {
          alert(pickText(uiText.copyFailed, state.lang));
        });
    };

    printButton.onclick = function () {
      window.print();
    };

    settingsButton.onclick = function () {
      if (state.filter) {
        setDrawerOpen(!state.drawerOpen);
        return;
      }

      ensureFilterModuleLoaded()
        .then(function () {
          render(state.originalData);
          setDrawerOpen(true);
        })
        .catch(function (error) {
          alert(error && error.message ? error.message : pickText(uiText.filterUnavailable, state.lang));
        });
    };

    closeFiltersAction.onclick = function () {
      setDrawerOpen(false);
    };

    filterBackdrop.onclick = function () {
      setDrawerOpen(false);
    };

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && state.drawerOpen) {
        setDrawerOpen(false);
      }
    });
  }

  bindTopbarActions();

  getData()
    .then(function (data) {
      state.originalData = data;
      render(data);
    })
    .catch(function (error) {
      var lang = document.documentElement.lang === "ko" ? "ko" : "en";
      var message = error && error.message ? error.message : pickText(uiText.loadError, lang);
      app.innerHTML = "<section class=\"cv-paper\"><h2>" + message + "</h2></section>";
    });
})();
