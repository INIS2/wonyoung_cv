(function () {
  "use strict";

  function createResumeFilter(options) {
    var elements = options.elements;
    var pickText = options.pickText;
    var onVisibilityChange = options.onVisibilityChange;
    var onCopyRequested = options.onCopyRequested;
    var shareContext = options.shareContext || {};

    var state = {
      hiddenPaths: [],
      selectedPath: "",
      lang: "en",
      data: null,
      includePassword: false
    };

    function setData(data) {
      state.data = data;
    }

    function setLanguage(lang) {
      state.lang = lang;
    }

    function setShareContext(nextContext) {
      shareContext = nextContext || {};
      syncShareOptions();
      updateShareOutput();
    }

    function setHiddenPaths(paths) {
      state.hiddenPaths = Array.isArray(paths) ? paths.slice().sort() : [];
    }

    function getHiddenPaths() {
      return state.hiddenPaths.slice();
    }

    function isPathHidden(path) {
      if (!path) return false;
      return state.hiddenPaths.some(function (hiddenPath) {
        return path === hiddenPath || path.indexOf(hiddenPath + ".") === 0;
      });
    }

    function setPathHidden(path, isHidden) {
      if (!path) return;

      state.hiddenPaths = state.hiddenPaths.filter(function (hiddenPath) {
        return hiddenPath !== path && hiddenPath.indexOf(path + ".") !== 0;
      });

      if (isHidden) {
        state.hiddenPaths.push(path);
        state.hiddenPaths.sort();
      }
    }

    function filterDataByVisibility(value, path) {
      if (isPathHidden(path)) return undefined;

      if (Array.isArray(value)) {
        return value
          .map(function (item, index) {
            return filterDataByVisibility(item, path ? path + "." + index : String(index));
          })
          .filter(function (item) { return item !== undefined; });
      }

      if (value && typeof value === "object") {
        var clone = {};
        Object.keys(value).forEach(function (key) {
          var nextPath = path ? path + "." + key : key;
          var nextValue = filterDataByVisibility(value[key], nextPath);
          if (nextValue !== undefined) clone[key] = nextValue;
        });
        return clone;
      }

      return value;
    }

    function getNodeByPath(data, path) {
      if (!path) return data;
      return path.split(".").reduce(function (acc, segment) {
        if (acc === undefined || acc === null) return undefined;
        if (Array.isArray(acc)) return acc[Number(segment)];
        return acc[segment];
      }, data);
    }

    function parentPathStartsWith(path, prefix) {
      return !!path && path.indexOf(prefix) === 0;
    }

    function getReadableLabel(key, value, path) {
      if (!path) return "resume.json";

      var segments = path.split(".");
      var last = segments[segments.length - 1];
      var parent = segments[segments.length - 2] || "";
      var isArrayEntry = /^\d+$/.test(last);
      var isLocalizedLeaf =
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).length &&
        Object.keys(value).every(function (childKey) {
          return childKey === "ko" || childKey === "en";
        });

      if (isLocalizedLeaf) {
        return last + " (" + pickText(value, state.lang) + ")";
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        if (!isArrayEntry) return key || last;
        if (value.key) return String(value.key);
        if (value.label) return String(value.label);

        var titled = pickText(value.title, state.lang) || pickText(value.name, state.lang);
        if (titled) return titled;
      }

      if (parent === "bullets" && typeof value === "string") {
        return value.length > 34 ? value.slice(0, 34) + "..." : value;
      }

      if (typeof value === "string") return last + ": " + value;
      if (typeof value === "number" || typeof value === "boolean") return last + ": " + String(value);
      if (Array.isArray(value)) return last + " [" + value.length + "]";

      return key || last;
    }

    function refreshTreeSelection() {
      Array.prototype.forEach.call(elements.treeControls.querySelectorAll(".tree-row"), function (row) {
        row.classList.toggle("is-selected", row.dataset.path === state.selectedPath);
      });
    }

    function updateSourcePanel() {
      if (!state.data) return;

      var value = getNodeByPath(state.data, state.selectedPath || "");
      elements.sourceTitle.textContent = state.selectedPath || "resume.json";
      elements.sourceSubtitle.textContent = state.selectedPath
        ? pickText(options.uiText.sourceNode, state.lang)
        : pickText(options.uiText.sourceFull, state.lang);
      elements.sourceView.textContent = JSON.stringify(value === undefined ? state.data : value, null, 2);
    }

    function createTreeNode(key, value, path, depth) {
      var node = document.createElement("div");
      node.className = "tree-node";
      node.style.setProperty("--depth", String(depth));

      var isExpandable = !!(value && typeof value === "object");
      var details = document.createElement("details");
      details.className = "tree-branch";
      details.dataset.path = path;
      details.open = isExpandable && (depth < 3 || parentPathStartsWith(path, "sections."));

      var summary = document.createElement("summary");
      var row = document.createElement("div");
      row.className = "tree-row" + (state.selectedPath === path ? " is-selected" : "");
      row.dataset.path = path;

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "tree-check";
      checkbox.checked = !isPathHidden(path);
      checkbox.disabled = !path;
      checkbox.addEventListener("click", function (event) {
        event.stopPropagation();
      });
      checkbox.addEventListener("change", function () {
        setPathHidden(path, !checkbox.checked);
        onVisibilityChange(getHiddenPaths());
      });

      var labelButton = document.createElement("button");
      labelButton.type = "button";
      labelButton.className = "tree-label";
      labelButton.textContent = getReadableLabel(key, value, path);
      labelButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        state.selectedPath = path;
        updateSourcePanel();
        refreshTreeSelection();
        if (isExpandable) details.open = !details.open;
      });

      row.appendChild(checkbox);
      row.appendChild(labelButton);
      summary.appendChild(row);
      details.appendChild(summary);

      if (isExpandable) {
        var children = document.createElement("div");
        children.className = "tree-children";

        if (Array.isArray(value)) {
          value.forEach(function (item, index) {
            children.appendChild(createTreeNode(String(index), item, path ? path + "." + index : String(index), depth + 1));
          });
        } else {
          Object.keys(value).forEach(function (childKey) {
            children.appendChild(createTreeNode(childKey, value[childKey], path ? path + "." + childKey : childKey, depth + 1));
          });
        }

        details.appendChild(children);
      }

      node.appendChild(details);
      return node;
    }

    function renderTree() {
      if (!state.data) return;
      elements.treeControls.innerHTML = "";
      elements.treeControls.appendChild(createTreeNode("resume", state.data, "", 0));
      refreshTreeSelection();
      updateSourcePanel();
      updateShareOutput();
    }

    function buildShareURL() {
      var url = new URL(location.href);

      if (state.hiddenPaths.length) {
        url.searchParams.set("hide", state.hiddenPaths.join(","));
      } else {
        url.searchParams.delete("hide");
      }

      if (!state.includePassword) {
        url.searchParams.delete("pw");
      } else if (shareContext.pw) {
        url.searchParams.set("pw", shareContext.pw);
      }

      return url.toString();
    }

    function updateShareOutput() {
      if (elements.shareUrlOutput) {
        elements.shareUrlOutput.value = buildShareURL();
      }
    }

    function syncShareOptions() {
      var shouldShowPasswordOption = !!(shareContext && shareContext.source && shareContext.pw);
      if (elements.sharePasswordRow) {
        elements.sharePasswordRow.hidden = !shouldShowPasswordOption;
      }
      if (!shouldShowPasswordOption) {
        state.includePassword = false;
      }
      if (elements.includePasswordToggle) {
        elements.includePasswordToggle.checked = state.includePassword;
      }
    }

    function bindEvents() {
      elements.showAllAction.onclick = function () {
        state.hiddenPaths = [];
        onVisibilityChange(getHiddenPaths());
      };

      elements.collapseAllAction.onclick = function () {
        Array.prototype.forEach.call(elements.treeControls.querySelectorAll("details"), function (node) {
          if (node.dataset.path) node.open = false;
        });
      };

      if (elements.copyFilterLinkAction) {
        elements.copyFilterLinkAction.onclick = function () {
          onCopyRequested(buildShareURL());
        };
      }

      if (elements.includePasswordToggle) {
        elements.includePasswordToggle.addEventListener("change", function () {
          state.includePassword = !!elements.includePasswordToggle.checked;
          updateShareOutput();
        });
      }
    }

    bindEvents();
    syncShareOptions();

    return {
      setData: setData,
      setLanguage: setLanguage,
      setHiddenPaths: setHiddenPaths,
      getHiddenPaths: getHiddenPaths,
      setShareContext: setShareContext,
      filterDataByVisibility: filterDataByVisibility,
      renderTree: renderTree,
      updateShareOutput: updateShareOutput,
      updateSourcePanel: updateSourcePanel
    };
  }

  window.ResumeFilter = {
    create: createResumeFilter
  };
})();
