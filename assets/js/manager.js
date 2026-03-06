(function () {
  "use strict";

  var editor = document.getElementById("json-editor");
  var sectionBoxes = document.getElementById("section-boxes");
  var generatedUrl = document.getElementById("generated-url");
  var openUrl = document.getElementById("open-url");
  var nameOverride = document.getElementById("name-override");

  var state = { data: null };

  function parseJSONSafe(raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function readChecked(selector) {
    return Array.from(document.querySelectorAll(selector + ":checked")).map(function (el) {
      return el.value;
    });
  }

  function buildSectionChecks(data) {
    sectionBoxes.innerHTML = "";
    data.sections.forEach(function (section) {
      var label = document.createElement("label");
      label.innerHTML = "<input type=\"checkbox\" class=\"section-box\" checked value=\"" + section.key + "\"> " + section.key;
      sectionBoxes.appendChild(label);
    });
  }

  function buildURL() {
    var params = new URLSearchParams();
    var lang = document.querySelector("input[name='lang']:checked").value;
    var show = readChecked(".section-box");
    var edu = readChecked(".edu-box");
    var name = nameOverride.value.trim();

    if (lang) params.set("lang", lang);
    if (name) params.set("name", name);
    if (show.length) params.set("show", show.join(","));
    if (edu.length) params.set("edu", edu.join("+"));

    var url = new URL("./", location.href);
    url.search = params.toString();
    generatedUrl.value = url.toString();
    openUrl.href = url.toString();
  }

  function applyEditorToPreview() {
    var parsed = parseJSONSafe(editor.value);
    if (!parsed) {
      alert("Invalid JSON format.");
      return;
    }
    localStorage.setItem("resumeDataOverride", JSON.stringify(parsed));
    state.data = parsed;
    buildSectionChecks(parsed);
    buildURL();
    alert("Preview data updated. Open the generated URL.");
  }

  function downloadJSON() {
    var parsed = parseJSONSafe(editor.value);
    if (!parsed) {
      alert("Invalid JSON format.");
      return;
    }
    var blob = new Blob([JSON.stringify(parsed, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "resume.json";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }

  function copyURL() {
    navigator.clipboard.writeText(generatedUrl.value).then(function () {
      alert("URL copied.");
    });
  }

  function bindEvents() {
    document.addEventListener("change", function (e) {
      if (
        e.target.matches("input[name='lang']") ||
        e.target.matches(".section-box") ||
        e.target.matches(".edu-box")
      ) {
        buildURL();
      }
    });
    nameOverride.addEventListener("input", buildURL);
    document.getElementById("apply-json").addEventListener("click", applyEditorToPreview);
    document.getElementById("download-json").addEventListener("click", downloadJSON);
    document.getElementById("copy-url").addEventListener("click", copyURL);
    document.getElementById("reset-json").addEventListener("click", loadBaseData);
  }

  function loadBaseData() {
    fetch("./data/resume.json")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        state.data = data;
        editor.value = JSON.stringify(data, null, 2);
        buildSectionChecks(data);
        buildURL();
      });
  }

  bindEvents();
  loadBaseData();
})();
