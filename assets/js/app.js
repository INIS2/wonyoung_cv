(function () {
  "use strict";

  var rootPath = "./";
  var app = document.getElementById("app");
  var langKoButton = document.getElementById("lang-ko");
  var langEnButton = document.getElementById("lang-en");
  var shareButton = document.getElementById("share-action");
  var printButton = document.getElementById("print-action");
  var settingsButton = document.getElementById("settings-action");
  var langToggle = document.getElementById("lang-toggle-group");

  function parseList(raw) {
    if (!raw) return [];
    return raw
      .replace(/\+/g, " ")
      .split(/[,\s]+/)
      .map(function (v) { return v.trim(); })
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
      show: parseList(qs.get("show")),
      edu: parseList(qs.get("edu"))
    };
  }

  function chooseLang(data, params) {
    if (params.lang === "ko" || params.lang === "en") return params.lang;
    return data.meta && data.meta.defaultLang ? data.meta.defaultLang : "en";
  }

  function getContactByLabel(data, label) {
    var contacts = data.profile.contacts || [];
    var found = contacts.find(function (item) {
      return (item.label || "").toLowerCase() === label.toLowerCase();
    });
    return found ? found.value : "";
  }

  function createHeader(data, lang, params) {
    var header = document.createElement("section");
    header.className = "cv-header";
    var displayName = params.name || pickText(data.profile.name, lang);
    var roleLine = [pickText(data.profile.title, lang), pickText(data.profile.location, lang)].filter(Boolean).join(" ");
    header.innerHTML =
      "<div class=\"cv-header-row\">" +
      "<img class=\"photo\" src=\"" + (data.profile.photo || "") + "\" alt=\"Profile photo\">" +
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
      "<h2 class=\"cv-section-title\">About</h2>" +
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
      var h3 = document.createElement("h3");
      h3.className = "cv-item-title";
      h3.textContent = title;
      return h3;
    }

    var h3WithLink = document.createElement("h3");
    h3WithLink.className = "cv-item-title";
    h3WithLink.innerHTML =
      "<a class=\"cv-link\" href=\"" + item.url + "\" target=\"_blank\" rel=\"noopener\">" +
      title + " <span class=\"cv-link-icon\">^</span></a>";
    return h3WithLink;
  }

  function renderSections(data, lang, params) {
    var wrap = document.createElement("section");

    data.sections.forEach(function (section) {
      if (!shouldIncludeSection(section, params)) return;

      var sectionEl = document.createElement("section");
      sectionEl.className = "cv-section";
      sectionEl.innerHTML = "<h2 class=\"cv-section-title\">" + pickText(section.title, lang) + "</h2>";

      section.items.forEach(function (item) {
        if (section.key === "education" && !shouldIncludeEducationItem(item, params)) return;

        var node = document.createElement("article");
        node.className = "cv-item";
        node.innerHTML =
          "<div class=\"cv-item-top\"><p class=\"cv-item-loc\"></p></div>" +
          "<div class=\"cv-item-subrow\">" +
          "<p class=\"cv-item-sub\"></p>" +
          "<p class=\"cv-item-period\"></p>" +
          "</div>" +
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

  function updateLangButton(lang) {
    if (!langKoButton || !langEnButton) return;

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

  function bindTopbarActions() {
    if (shareButton) {
      shareButton.onclick = function () {
        navigator.clipboard.writeText(location.href);
      };
    }
    if (printButton) {
      printButton.onclick = function () {
        window.print();
      };
    }
    if (settingsButton) {
      settingsButton.onclick = function () {
        location.href = "manager.html";
      };
    }
  }

  function updateTooltips(lang) {
    var isKo = lang === "ko";
    if (langToggle) langToggle.setAttribute("data-tooltip", isKo ? "언어" : "Language");
    if (shareButton) shareButton.setAttribute("data-tooltip", isKo ? "공유" : "Share");
    if (printButton) printButton.setAttribute("data-tooltip", isKo ? "인쇄" : "Print");
    if (settingsButton) settingsButton.setAttribute("data-tooltip", isKo ? "설정" : "Settings");
  }

  function render(data) {
    var params = getParams();
    var lang = chooseLang(data, params);
    document.documentElement.lang = lang;

    app.innerHTML = "";
    var paper = document.createElement("div");
    paper.className = "cv-paper";
    paper.appendChild(createHeader(data, lang, params));
    paper.appendChild(createAbout(data, lang));
    paper.appendChild(renderSections(data, lang, params));
    app.appendChild(paper);
    updateLangButton(lang);
    updateTooltips(lang);
  }

  function getData() {
    var local = localStorage.getItem("resumeDataOverride");
    if (local) {
      try {
        return Promise.resolve(JSON.parse(local));
      } catch (error) {
      }
    }
    return fetch(rootPath + "data/resume.json").then(function (res) { return res.json(); });
  }

  getData()
    .then(render)
    .catch(function () {
      app.innerHTML = "<section class=\"card\"><h2>Failed to load resume data</h2></section>";
    });

  bindTopbarActions();
})();
