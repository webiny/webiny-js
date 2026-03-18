/* eslint-disable */
(function () {
    "use strict";

    // ── State ──────────────────────────────────────────────────────
    let lastRevision = -1;
    let configs = {};
    let selectedConfig = null;
    let activeTab = "browse"; // "browse" | "config" | "properties"
    let selectedKey = null;

    // ── DOM refs ───────────────────────────────────────────────────
    const sidebar = document.getElementById("sidebar");
    const detail = document.getElementById("detail");
    const configCount = document.getElementById("configCount");
    const refreshBtn = document.getElementById("refreshBtn");

    // ── Polling ────────────────────────────────────────────────────
    function checkRevision() {
        chrome.devtools.inspectedWindow.eval(
            "window.__WEBINY_DEVTOOLS_HOOK__?.revision ?? -1",
            function (revision, err) {
                if (err) return;
                if (revision !== lastRevision) {
                    lastRevision = revision;
                    fetchFullData();
                }
            }
        );
    }

    function fetchFullData() {
        chrome.devtools.inspectedWindow.eval(
            [
                "(function() {",
                "  var h = window.__WEBINY_DEVTOOLS_HOOK__;",
                "  if (!h) return null;",
                "  return JSON.parse(JSON.stringify(h.configs, function(k, v) {",
                "    if (typeof v === 'function') return '[Function: ' + (v.name || 'anonymous') + ']';",
                "    if (v !== null && typeof v === 'object' && v.$$typeof) return '[ReactElement: ' + (typeof v.type === 'string' ? v.type : v.type?.displayName || v.type?.name || 'Unknown') + ']';",
                "    if (typeof v === 'undefined') return '[undefined]';",
                "    return v;",
                "  }));",
                "})()"
            ].join("\n"),
            function (result, err) {
                if (err || !result) {
                    configs = {};
                } else {
                    configs = result;
                }
                render();
            }
        );
    }

    // ── Rendering ──────────────────────────────────────────────────
    function render() {
        renderSidebar();
        renderDetail();
    }

    function renderSidebar() {
        var names = Object.keys(configs).sort();
        configCount.textContent = names.length + " config" + (names.length !== 1 ? "s" : "");

        if (names.length === 0) {
            sidebar.innerHTML =
                '<div class="sidebar-empty">No configs detected.<br>Make sure the app is running in development mode.</div>';
            return;
        }

        // If selected config no longer exists, deselect
        if (selectedConfig && !configs[selectedConfig]) {
            selectedConfig = null;
        }

        sidebar.innerHTML = "";
        names.forEach(function (name) {
            var item = document.createElement("div");
            item.className = "sidebar-item" + (name === selectedConfig ? " selected" : "");
            item.title = name;

            var propCount = configs[name]?.properties?.length || 0;
            item.innerHTML = esc(name) + '<span class="badge">' + propCount + "</span>";

            item.addEventListener("click", function () {
                selectedConfig = name;
                selectedKey = null;
                render();
            });
            sidebar.appendChild(item);
        });
    }

    function renderDetail() {
        if (!selectedConfig || !configs[selectedConfig]) {
            detail.innerHTML = '<div class="detail-empty">Select a config from the sidebar.</div>';
            return;
        }

        var data = configs[selectedConfig];

        detail.innerHTML = "";

        // Tabs
        var tabs = document.createElement("div");
        tabs.className = "tabs";

        var tabBrowse = createTab("Browse", "browse");
        var tabConfig = createTab("Config Object", "config");
        var tabProps = createTab("Raw Properties (" + (data.properties?.length || 0) + ")", "properties");
        tabs.appendChild(tabBrowse);
        tabs.appendChild(tabConfig);
        tabs.appendChild(tabProps);
        detail.appendChild(tabs);

        // Browse tab — split: key list on the left, value detail on the right
        var browseContent = document.createElement("div");
        browseContent.className = "tab-content tab-content-browse" + (activeTab !== "browse" ? " hidden" : "");
        var configObj = data.config;
        if (configObj && typeof configObj === "object" && !Array.isArray(configObj)) {
            var rootKeys = Object.keys(configObj);

            // Reset selectedKey if it no longer exists
            if (selectedKey && rootKeys.indexOf(selectedKey) === -1) {
                selectedKey = null;
            }

            var browseKeyList = document.createElement("div");
            browseKeyList.className = "browse-keys";

            rootKeys.forEach(function (key) {
                var keyItem = document.createElement("div");
                keyItem.className = "browse-key-item" + (key === selectedKey ? " selected" : "");
                var val = configObj[key];
                var subtitle = "";
                if (Array.isArray(val)) {
                    subtitle = "Array (" + val.length + ")";
                } else if (val && typeof val === "object") {
                    subtitle = "Object (" + Object.keys(val).length + " keys)";
                } else {
                    subtitle = formatValue(val);
                }
                keyItem.innerHTML = '<div class="browse-key-name">' + esc(key) + '</div>' +
                    '<div class="browse-key-type">' + esc(subtitle) + '</div>';
                keyItem.addEventListener("click", function () {
                    selectedKey = key;
                    renderDetail();
                });
                browseKeyList.appendChild(keyItem);
            });

            var browseValue = document.createElement("div");
            browseValue.className = "browse-value";

            if (selectedKey && configObj[selectedKey] !== undefined) {
                var browseNodes = [];
                var valueTree = document.createElement("div");
                valueTree.className = "json-tree";
                buildJsonTree(configObj[selectedKey], valueTree, 0, browseNodes);
                if (browseNodes.length > 0) {
                    buildTreeToolbar(browseValue, browseNodes);
                }
                browseValue.appendChild(valueTree);
            } else {
                var emptyMsg = document.createElement("div");
                emptyMsg.className = "browse-value-empty";
                emptyMsg.textContent = rootKeys.length > 0 ? "Select a key to inspect." : "Empty config object.";
                browseValue.appendChild(emptyMsg);
            }

            browseContent.appendChild(browseKeyList);
            browseContent.appendChild(browseValue);
        } else {
            var fallback = document.createElement("div");
            fallback.className = "json-tree";
            buildJsonTree(configObj, fallback, 0, null);
            browseContent.appendChild(fallback);
        }
        detail.appendChild(browseContent);

        // Config object tab
        var configContent = document.createElement("div");
        configContent.className = "tab-content" + (activeTab !== "config" ? " hidden" : "");
        var configNodes = [];
        var tree = document.createElement("div");
        tree.className = "json-tree";
        buildJsonTree(data.config, tree, 0, configNodes);
        if (configNodes.length > 0) {
            buildTreeToolbar(configContent, configNodes);
        }
        configContent.appendChild(tree);
        detail.appendChild(configContent);

        // Properties tab
        var propsContent = document.createElement("div");
        propsContent.className = "tab-content" + (activeTab !== "properties" ? " hidden" : "");
        propsContent.appendChild(buildPropertiesTable(data.properties || []));
        detail.appendChild(propsContent);
    }

    function createTab(label, tabId) {
        var tab = document.createElement("div");
        tab.className = "tab" + (activeTab === tabId ? " active" : "");
        tab.textContent = label;
        tab.addEventListener("click", function () {
            activeTab = tabId;
            renderDetail();
        });
        return tab;
    }

    // ── JSON tree builder ──────────────────────────────────────────

    function buildTreeToolbar(targetContainer, nodeList) {
        var bar = document.createElement("div");
        bar.className = "tree-toolbar";
        var expandBtn = document.createElement("button");
        expandBtn.className = "tree-toolbar-btn";
        expandBtn.textContent = "Expand All";
        expandBtn.addEventListener("click", function () {
            // Expanding a node lazily creates children which push new entries
            // onto nodeList. Use an index loop so we pick up new nodes.
            for (var i = 0; i < nodeList.length; i++) {
                nodeList[i].setExpanded(true);
            }
        });
        var collapseBtn = document.createElement("button");
        collapseBtn.className = "tree-toolbar-btn";
        collapseBtn.textContent = "Collapse";
        collapseBtn.addEventListener("click", function () {
            for (var i = 0; i < nodeList.length; i++) {
                nodeList[i].setExpanded(nodeList[i].depth < 2);
            }
        });
        bar.appendChild(expandBtn);
        bar.appendChild(collapseBtn);
        targetContainer.appendChild(bar);
    }

    function buildJsonTree(value, container, depth, nodeList) {
        if (value === null) {
            container.appendChild(span("null", "json-null"));
            return;
        }

        if (Array.isArray(value)) {
            buildCollapsible(value, container, depth, true, nodeList);
            return;
        }

        if (typeof value === "object") {
            buildCollapsible(value, container, depth, false, nodeList);
            return;
        }

        if (typeof value === "string") {
            if (value.startsWith("[Function:") || value.startsWith("[ReactElement:")) {
                container.appendChild(span(value, "json-function"));
            } else {
                container.appendChild(span('"' + esc(value) + '"', "json-string"));
            }
            return;
        }

        if (typeof value === "number") {
            container.appendChild(span(String(value), "json-number"));
            return;
        }

        if (typeof value === "boolean") {
            container.appendChild(span(String(value), "json-boolean"));
            return;
        }

        container.appendChild(span(String(value), "json-null"));
    }

    function buildCollapsible(obj, container, depth, isArray, nodeList) {
        var keys = isArray ? obj : Object.keys(obj);
        var count = isArray ? obj.length : Object.keys(obj).length;
        var openBracket = isArray ? "[" : "{";
        var closeBracket = isArray ? "]" : "}";
        var expanded = depth < 2; // auto-expand first 2 levels

        if (count === 0) {
            container.appendChild(span(openBracket + closeBracket, "json-bracket"));
            return;
        }

        var toggle = span(expanded ? "\u25BE " : "\u25B8 ", "json-toggle");
        container.appendChild(toggle);
        container.appendChild(span(openBracket, "json-bracket"));

        var preview = span(
            " " + count + (isArray ? " item" : " key") + (count !== 1 ? "s" : "") + " ",
            "json-collapsed-preview"
        );
        container.appendChild(preview);

        var closingInline = span(closeBracket, "json-bracket");
        container.appendChild(closingInline);

        var childContainer = document.createElement("div");
        childContainer.className = "json-node";
        container.appendChild(childContainer);

        var closingBlock = span(closeBracket, "json-bracket");
        container.appendChild(closingBlock);

        function setExpanded(exp) {
            expanded = exp;
            toggle.textContent = expanded ? "\u25BE " : "\u25B8 ";
            childContainer.style.display = expanded ? "block" : "none";
            preview.style.display = expanded ? "none" : "inline";
            closingInline.style.display = expanded ? "none" : "inline";
            closingBlock.style.display = expanded ? "inline" : "none";

            if (expanded && childContainer.children.length === 0) {
                populateChildren();
            }
        }

        if (nodeList) {
            nodeList.push({ setExpanded: setExpanded, depth: depth });
        }

        function populateChildren() {
            var entries = isArray
                ? obj.map(function (v, i) { return [i, v]; })
                : Object.keys(obj).map(function (k) { return [k, obj[k]]; });

            entries.forEach(function (entry, idx) {
                var line = document.createElement("div");
                line.appendChild(span(isArray ? String(entry[0]) : '"' + esc(String(entry[0])) + '"', "json-key"));
                line.appendChild(span(": ", "json-bracket"));
                buildJsonTree(entry[1], line, depth + 1, nodeList);
                if (idx < entries.length - 1) {
                    line.appendChild(span(",", "json-bracket"));
                }
                childContainer.appendChild(line);
            });
        }

        toggle.addEventListener("click", function () {
            setExpanded(!expanded);
        });

        setExpanded(expanded);
    }

    // ── Properties table ───────────────────────────────────────────
    function buildPropertiesTable(properties) {
        var table = document.createElement("table");
        table.className = "props-table";

        var thead = document.createElement("thead");
        thead.innerHTML =
            "<tr><th>id</th><th>parent</th><th>name</th><th>value</th><th>array</th></tr>";
        table.appendChild(thead);

        var tbody = document.createElement("tbody");
        properties.forEach(function (p) {
            var row = document.createElement("tr");
            row.innerHTML =
                "<td>" + esc(p.id) + "</td>" +
                "<td>" + esc(p.parent || "(root)") + "</td>" +
                "<td>" + esc(p.name) + "</td>" +
                "<td>" + esc(formatValue(p.value)) + "</td>" +
                "<td>" + (p.array ? "true" : "") + "</td>";
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        return table;
    }

    function formatValue(val) {
        if (val === undefined || val === "[undefined]") return "";
        if (val === null) return "null";
        if (typeof val === "string") return val;
        try {
            return JSON.stringify(val);
        } catch (e) {
            return String(val);
        }
    }

    // ── Helpers ────────────────────────────────────────────────────
    function span(text, cls) {
        var el = document.createElement("span");
        el.className = cls || "";
        el.textContent = text;
        return el;
    }

    function esc(str) {
        var div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    // ── Init ───────────────────────────────────────────────────────
    refreshBtn.addEventListener("click", function () {
        lastRevision = -1;
        checkRevision();
    });

    // Poll every 500ms
    setInterval(checkRevision, 500);
    checkRevision();
})();
