(function () {
    "use strict";

    // ── State ──────────────────────────────────────────────────────
    let lastRevision = -1;
    let configs = {};
    let sections = {};
    let selectedItem = null; // { type: "config"|"section", name: string }
    let activeTab = "browse"; // "browse" | "config" | "properties"
    let selectedKey = null;
    // Remembers expand-all state per toolbar context: key → true|false|null
    var expandAllStates = {};

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

    var SERIALIZER = [
        "(function() {",
        "  var h = window.__WEBINY_DEVTOOLS_HOOK__;",
        "  if (!h) return null;",
        "  var replacer = function(k, v) {",
        "    if (typeof v === 'function') return '[Function: ' + (v.name || 'anonymous') + ']';",
        "    if (v !== null && typeof v === 'object' && v.$$typeof) return '[ReactElement: ' + (typeof v.type === 'string' ? v.type : v.type?.displayName || v.type?.name || 'Unknown') + ']';",
        "    if (typeof v === 'undefined') return '[undefined]';",
        "    return v;",
        "  };",
        "  return {",
        "    configs: JSON.parse(JSON.stringify(h.configs || {}, replacer)),",
        "    sections: JSON.parse(JSON.stringify(h.sections || {}, replacer))",
        "  };",
        "})()"
    ].join("\n");

    function getSelectedData() {
        if (!selectedItem) return undefined;
        if (selectedItem.type === "config") return configs[selectedItem.name];
        return sections[selectedItem.name];
    }

    function fetchFullData() {
        chrome.devtools.inspectedWindow.eval(SERIALIZER, function (result, err) {
            var prevSelected = JSON.stringify(getSelectedData());

            if (err || !result) {
                configs = {};
                sections = {};
            } else {
                configs = result.configs || {};
                sections = result.sections || {};
            }

            var newSelected = JSON.stringify(getSelectedData());

            // If the currently viewed item's data hasn't changed,
            // only update the sidebar (counts/names) without rebuilding
            // the detail pane, preserving scroll and expand state.
            if (selectedItem && prevSelected === newSelected) {
                var sidebarScroll = sidebar.scrollTop;
                renderSidebar();
                sidebar.scrollTop = sidebarScroll;
            } else {
                render();
            }
        });
    }

    // ── Scroll preservation ─────────────────────────────────────────
    function saveScrollPositions() {
        var positions = {};
        positions.sidebar = sidebar.scrollTop;
        var browseKeys = detail.querySelector(".browse-keys");
        if (browseKeys) positions.browseKeys = browseKeys.scrollTop;
        var browseValue = detail.querySelector(".browse-value");
        if (browseValue) positions.browseValue = browseValue.scrollTop;
        // Save all visible tab-content scroll positions by index
        var tabContents = detail.querySelectorAll(".tab-content");
        positions.tabs = [];
        for (var i = 0; i < tabContents.length; i++) {
            positions.tabs.push(tabContents[i].scrollTop);
        }
        return positions;
    }

    function restoreScrollPositions(positions) {
        if (!positions) return;
        sidebar.scrollTop = positions.sidebar || 0;
        var browseKeys = detail.querySelector(".browse-keys");
        if (browseKeys) browseKeys.scrollTop = positions.browseKeys || 0;
        var browseValue = detail.querySelector(".browse-value");
        if (browseValue) browseValue.scrollTop = positions.browseValue || 0;
        var tabContents = detail.querySelectorAll(".tab-content");
        if (positions.tabs) {
            for (var i = 0; i < tabContents.length && i < positions.tabs.length; i++) {
                tabContents[i].scrollTop = positions.tabs[i] || 0;
            }
        }
    }

    // ── Rendering ──────────────────────────────────────────────────
    function render() {
        var scrollPos = saveScrollPositions();
        renderSidebar();
        renderDetail();
        restoreScrollPositions(scrollPos);
    }

    function renderSidebar() {
        var configNames = Object.keys(configs).sort();
        var sectionNames = Object.keys(sections).sort();
        var total = configNames.length + sectionNames.length;

        configCount.textContent = total + " item" + (total !== 1 ? "s" : "");

        if (total === 0) {
            sidebar.innerHTML =
                '<div class="sidebar-empty">No configs or sections detected.<br>Make sure the app is running in development mode.</div>';
            return;
        }

        // If selected item no longer exists, deselect
        if (selectedItem) {
            if (selectedItem.type === "config" && !configs[selectedItem.name]) {
                selectedItem = null;
            } else if (selectedItem.type === "section" && !sections[selectedItem.name]) {
                selectedItem = null;
            }
        }

        sidebar.innerHTML = "";

        // Configs group
        if (configNames.length > 0) {
            var configHeader = document.createElement("div");
            configHeader.className = "sidebar-group-header";
            configHeader.textContent = "CONFIGS (" + configNames.length + ")";
            sidebar.appendChild(configHeader);

            configNames.forEach(function (name) {
                var isSelected =
                    selectedItem && selectedItem.type === "config" && selectedItem.name === name;
                var item = document.createElement("div");
                item.className = "sidebar-item" + (isSelected ? " selected" : "");
                item.title = name;

                var propCount = configs[name]?.properties?.length || 0;
                item.innerHTML = esc(name) + '<span class="badge">' + propCount + "</span>";

                item.addEventListener("click", function () {
                    selectedItem = { type: "config", name: name };
                    selectedKey = null;
                    activeTab = "browse";
                    render();
                });
                sidebar.appendChild(item);
            });
        }

        // Sections — grouped by their `group` property
        if (sectionNames.length > 0) {
            // Build groups: { groupName: [name, name, ...] } preserving sorted order
            var groups = {};
            var groupOrder = [];
            sectionNames.forEach(function (name) {
                var g = (sections[name] && sections[name].group) || "Sections";
                if (!groups[g]) {
                    groups[g] = [];
                    groupOrder.push(g);
                }
                groups[g].push(name);
            });

            groupOrder.forEach(function (groupName) {
                var names = groups[groupName];
                var groupHeader = document.createElement("div");
                groupHeader.className = "sidebar-group-header";
                groupHeader.textContent = groupName.toUpperCase() + " (" + names.length + ")";
                sidebar.appendChild(groupHeader);

                names.forEach(function (name) {
                    var isSelected =
                        selectedItem &&
                        selectedItem.type === "section" &&
                        selectedItem.name === name;
                    var item = document.createElement("div");
                    item.className = "sidebar-item" + (isSelected ? " selected" : "");
                    item.title = name;
                    item.innerHTML = esc(name);

                    item.addEventListener("click", function () {
                        selectedItem = { type: "section", name: name };
                        selectedKey = null;
                        var sv = sections[name] && sections[name].views;
                        activeTab = sv && sv.length > 0 ? sv[0] : "browse";
                        render();
                    });
                    sidebar.appendChild(item);
                });
            });
        }
    }

    function renderDetail() {
        if (!selectedItem) {
            detail.innerHTML = '<div class="detail-empty">Select an item from the sidebar.</div>';
            return;
        }

        if (selectedItem.type === "config") {
            renderConfigDetail();
        } else {
            renderSectionDetail();
        }
    }

    function renderConfigDetail() {
        var data = configs[selectedItem.name];
        if (!data) {
            detail.innerHTML = '<div class="detail-empty">Config no longer available.</div>';
            return;
        }

        detail.innerHTML = "";

        // Tabs
        var tabs = document.createElement("div");
        tabs.className = "tabs";

        var tabBrowse = createTab("Browse", "browse");
        var tabConfig = createTab("Config Object", "config");
        var tabProps = createTab(
            "Raw Properties (" + (data.properties?.length || 0) + ")",
            "properties"
        );
        tabs.appendChild(tabBrowse);
        tabs.appendChild(tabConfig);
        tabs.appendChild(tabProps);
        detail.appendChild(tabs);

        // Browse tab — split: key list on the left, value detail on the right
        var browseContent = document.createElement("div");
        browseContent.className =
            "tab-content tab-content-browse" + (activeTab !== "browse" ? " hidden" : "");
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
                keyItem.innerHTML =
                    '<div class="browse-key-name">' +
                    esc(key) +
                    "</div>" +
                    '<div class="browse-key-type">' +
                    esc(subtitle) +
                    "</div>";
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
                var browseStateKey = getExpandStateKey("browse-value");
                buildJsonTree(configObj[selectedKey], valueTree, 0, browseNodes, expandAllStates[browseStateKey]);
                if (browseNodes.length > 0) {
                    buildTreeToolbar(browseValue, browseNodes, valueTree, configObj[selectedKey], browseStateKey);
                    applyExpandState(browseNodes, expandAllStates[browseStateKey]);
                }
                browseValue.appendChild(valueTree);
            } else {
                var emptyMsg = document.createElement("div");
                emptyMsg.className = "browse-value-empty";
                emptyMsg.textContent =
                    rootKeys.length > 0 ? "Select a key to inspect." : "Empty config object.";
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
        var configStateKey = getExpandStateKey("config-object");
        buildJsonTree(data.config, tree, 0, configNodes, expandAllStates[configStateKey]);
        if (configNodes.length > 0) {
            buildTreeToolbar(configContent, configNodes, tree, data.config, configStateKey);
            applyExpandState(configNodes, expandAllStates[configStateKey]);
        }
        configContent.appendChild(tree);
        detail.appendChild(configContent);

        // Properties tab
        var propsContent = document.createElement("div");
        propsContent.className = "tab-content" + (activeTab !== "properties" ? " hidden" : "");
        propsContent.appendChild(buildPropertiesTable(data.properties || []));
        detail.appendChild(propsContent);
    }

    function renderSectionDetail() {
        var data = sections[selectedItem.name];
        if (!data) {
            detail.innerHTML = '<div class="detail-empty">Section no longer available.</div>';
            return;
        }

        var views = data.views && data.views.length > 0 ? data.views : ["browse", "raw"];
        var sectionData = data.data;

        // If activeTab is not in the allowed views, default to first view
        if (views.indexOf(activeTab) === -1) {
            activeTab = views[0];
        }

        detail.innerHTML = "";

        // Tabs (show tab bar when multiple views)
        var tabs = document.createElement("div");
        tabs.className = "tabs";
        var viewLabels = { browse: "Browse", raw: "Raw Object" };
        views.forEach(function (v) {
            var tab = document.createElement("div");
            tab.className = "tab" + (activeTab === v ? " active" : "");
            tab.textContent = viewLabels[v] || v;
            tab.addEventListener("click", function () {
                activeTab = v;
                renderDetail();
            });
            tabs.appendChild(tab);
        });
        detail.appendChild(tabs);

        // Browse view
        if (views.indexOf("browse") !== -1) {
            var browseContent = document.createElement("div");
            browseContent.className =
                "tab-content tab-content-browse" + (activeTab !== "browse" ? " hidden" : "");

            if (sectionData && typeof sectionData === "object" && !Array.isArray(sectionData)) {
                var rootKeys = Object.keys(sectionData);

                if (selectedKey && rootKeys.indexOf(selectedKey) === -1) {
                    selectedKey = null;
                }

                var keyList = document.createElement("div");
                keyList.className = "browse-keys";

                rootKeys.forEach(function (key) {
                    var keyItem = document.createElement("div");
                    keyItem.className =
                        "browse-key-item" + (key === selectedKey ? " selected" : "");
                    var val = sectionData[key];
                    var subtitle = "";
                    if (Array.isArray(val)) {
                        subtitle = "Array (" + val.length + ")";
                    } else if (val && typeof val === "object") {
                        subtitle = "Object (" + Object.keys(val).length + " keys)";
                    } else {
                        subtitle = formatValue(val);
                    }
                    keyItem.innerHTML =
                        '<div class="browse-key-name">' +
                        esc(key) +
                        "</div>" +
                        '<div class="browse-key-type">' +
                        esc(subtitle) +
                        "</div>";
                    keyItem.addEventListener("click", function () {
                        selectedKey = key;
                        renderDetail();
                    });
                    keyList.appendChild(keyItem);
                });

                var valuePane = document.createElement("div");
                valuePane.className = "browse-value";

                if (selectedKey && sectionData[selectedKey] !== undefined) {
                    var bNodes = [];
                    var valueTree = document.createElement("div");
                    valueTree.className = "json-tree";
                    var secBrowseStateKey = getExpandStateKey("section-browse-value");
                    buildJsonTree(sectionData[selectedKey], valueTree, 0, bNodes, expandAllStates[secBrowseStateKey]);
                    if (bNodes.length > 0) {
                        buildTreeToolbar(valuePane, bNodes, valueTree, sectionData[selectedKey], secBrowseStateKey);
                        applyExpandState(bNodes, expandAllStates[secBrowseStateKey]);
                    }
                    valuePane.appendChild(valueTree);
                } else {
                    var emptyMsg = document.createElement("div");
                    emptyMsg.className = "browse-value-empty";
                    emptyMsg.textContent =
                        rootKeys.length > 0 ? "Select a key to inspect." : "Empty section data.";
                    valuePane.appendChild(emptyMsg);
                }

                browseContent.appendChild(keyList);
                browseContent.appendChild(valuePane);
            } else {
                // Non-object: fall back to raw tree inside browse tab
                var fbNodes = [];
                var fbTree = document.createElement("div");
                fbTree.className = "json-tree";
                var fbStateKey = getExpandStateKey("section-browse-raw");
                buildJsonTree(sectionData, fbTree, 0, fbNodes, expandAllStates[fbStateKey]);
                if (fbNodes.length > 0) {
                    buildTreeToolbar(browseContent, fbNodes, fbTree, sectionData, fbStateKey);
                    applyExpandState(fbNodes, expandAllStates[fbStateKey]);
                }
                browseContent.appendChild(fbTree);
            }
            detail.appendChild(browseContent);
        }

        // Raw Object view
        if (views.indexOf("raw") !== -1) {
            var rawContent = document.createElement("div");
            rawContent.className = "tab-content" + (activeTab !== "raw" ? " hidden" : "");
            var rNodes = [];
            var rTree = document.createElement("div");
            rTree.className = "json-tree";
            var rawStateKey = getExpandStateKey("section-raw");
            buildJsonTree(sectionData, rTree, 0, rNodes, expandAllStates[rawStateKey]);
            if (rNodes.length > 0) {
                buildTreeToolbar(rawContent, rNodes, rTree, sectionData, rawStateKey);
                applyExpandState(rNodes, expandAllStates[rawStateKey]);
            }
            rawContent.appendChild(rTree);
            detail.appendChild(rawContent);
        }
    }

    function getExpandStateKey(context) {
        var item = selectedItem ? selectedItem.type + ":" + selectedItem.name : "none";
        var key = selectedKey || "";
        return item + "|" + activeTab + "|" + key + "|" + context;
    }

    function applyExpandState(nodeList, expandAllState) {
        if (expandAllState === true) {
            for (var i = 0; i < nodeList.length; i++) {
                nodeList[i].setExpanded(true);
            }
        } else if (expandAllState === false) {
            for (var i = 0; i < nodeList.length; i++) {
                nodeList[i].setExpanded(nodeList[i].depth < 2);
            }
        }
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

    // Search: recursively check if a value (or any descendant) contains the query
    function valueContains(value, query) {
        if (value === null || value === undefined) return false;
        if (typeof value === "string") return value.toLowerCase().indexOf(query) !== -1;
        if (typeof value === "number" || typeof value === "boolean") {
            return String(value).toLowerCase().indexOf(query) !== -1;
        }
        if (Array.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                if (valueContains(value[i], query)) return true;
            }
            return false;
        }
        if (typeof value === "object") {
            var keys = Object.keys(value);
            for (var j = 0; j < keys.length; j++) {
                if (keys[j].toLowerCase().indexOf(query) !== -1) return true;
                if (valueContains(value[keys[j]], query)) return true;
            }
            return false;
        }
        return false;
    }

    // Filter: return a new value keeping only matching branches
    function filterValue(value, query) {
        if (value === null || value === undefined) return undefined;
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            return valueContains(value, query) ? value : undefined;
        }
        if (Array.isArray(value)) {
            var filtered = [];
            for (var i = 0; i < value.length; i++) {
                if (valueContains(value[i], query)) {
                    filtered.push(value[i]);
                }
            }
            return filtered.length > 0 ? filtered : undefined;
        }
        if (typeof value === "object") {
            var result = {};
            var hasMatch = false;
            var keys = Object.keys(value);
            for (var j = 0; j < keys.length; j++) {
                var k = keys[j];
                if (k.toLowerCase().indexOf(query) !== -1 || valueContains(value[k], query)) {
                    result[k] = value[k];
                    hasMatch = true;
                }
            }
            return hasMatch ? result : undefined;
        }
        return undefined;
    }

    function buildTreeToolbar(targetContainer, nodeList, treeContainer, originalData, stateKey) {
        var bar = document.createElement("div");
        bar.className = "tree-toolbar";
        // null = default (depth-based), true = expand all, false = collapse all
        // Persist state across re-renders via expandAllStates map
        var expandAllState = stateKey != null ? (expandAllStates[stateKey] ?? null) : null;

        var expandBtn = document.createElement("button");
        expandBtn.className = "tree-toolbar-btn";
        expandBtn.textContent = "Expand All";
        expandBtn.addEventListener("click", function () {
            expandAllState = true;
            if (stateKey != null) expandAllStates[stateKey] = true;
            for (var i = 0; i < nodeList.length; i++) {
                nodeList[i].setExpanded(true);
            }
        });
        var collapseBtn = document.createElement("button");
        collapseBtn.className = "tree-toolbar-btn";
        collapseBtn.textContent = "Collapse";
        collapseBtn.addEventListener("click", function () {
            expandAllState = false;
            if (stateKey != null) expandAllStates[stateKey] = false;
            for (var i = 0; i < nodeList.length; i++) {
                nodeList[i].setExpanded(nodeList[i].depth < 2);
            }
        });

        var searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "tree-search-input";
        searchInput.placeholder = "Filter...";

        var searchInfo = document.createElement("span");
        searchInfo.className = "tree-search-info";

        var debounceTimer = null;
        searchInput.addEventListener("input", function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
                var query = searchInput.value.trim().toLowerCase();
                // Clear and rebuild tree
                nodeList.length = 0;
                treeContainer.innerHTML = "";

                if (!query) {
                    searchInfo.textContent = "";
                    buildJsonTree(originalData, treeContainer, 0, nodeList, expandAllState);
                    if (expandAllState === true) {
                        for (var i = 0; i < nodeList.length; i++) {
                            nodeList[i].setExpanded(true);
                        }
                    } else if (expandAllState === false) {
                        for (var i = 0; i < nodeList.length; i++) {
                            nodeList[i].setExpanded(nodeList[i].depth < 2);
                        }
                    }
                } else {
                    var filtered = filterValue(originalData, query);
                    if (filtered !== undefined) {
                        buildJsonTree(filtered, treeContainer, 0, nodeList, expandAllState);
                        // Expand all when searching
                        for (var i = 0; i < nodeList.length; i++) {
                            nodeList[i].setExpanded(true);
                        }
                        searchInfo.textContent = "";
                    } else {
                        searchInfo.textContent = "No matches";
                    }
                }
            }, 200);
        });

        var copyBtn = document.createElement("button");
        copyBtn.className = "tree-toolbar-btn";
        copyBtn.textContent = "Copy";
        copyBtn.addEventListener("click", function () {
            copyToClipboard(JSON.stringify(originalData, null, 2));
            copyBtn.textContent = "Copied!";
            setTimeout(function () {
                copyBtn.textContent = "Copy";
            }, 1200);
        });

        bar.appendChild(expandBtn);
        bar.appendChild(collapseBtn);
        bar.appendChild(copyBtn);
        bar.appendChild(searchInput);
        bar.appendChild(searchInfo);
        targetContainer.appendChild(bar);
    }

    function buildJsonTree(value, container, depth, nodeList, expandAllState) {
        if (value === null) {
            var s = span("null", "json-null");
            attachCopyMenu(s, null);
            container.appendChild(s);
            return;
        }

        if (Array.isArray(value)) {
            buildCollapsible(value, container, depth, true, nodeList, expandAllState);
            return;
        }

        if (typeof value === "object") {
            buildCollapsible(value, container, depth, false, nodeList, expandAllState);
            return;
        }

        var leaf;
        if (typeof value === "string") {
            if (value.startsWith("[Function:") || value.startsWith("[ReactElement:")) {
                leaf = span(value, "json-function");
            } else {
                leaf = span('"' + esc(value) + '"', "json-string");
            }
        } else if (typeof value === "number") {
            leaf = span(String(value), "json-number");
        } else if (typeof value === "boolean") {
            leaf = span(String(value), "json-boolean");
        } else {
            leaf = span(String(value), "json-null");
        }
        attachCopyMenu(leaf, value);
        container.appendChild(leaf);
    }

    function buildCollapsible(obj, container, depth, isArray, nodeList, expandAllState) {
        var keys = isArray ? obj : Object.keys(obj);
        var count = isArray ? obj.length : Object.keys(obj).length;
        var openBracket = isArray ? "[" : "{";
        var closeBracket = isArray ? "]" : "}";
        var expanded =
            expandAllState === true ? true : expandAllState === false ? depth < 2 : depth < 2;

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
                ? obj.map(function (v, i) {
                      return [i, v];
                  })
                : Object.keys(obj).map(function (k) {
                      return [k, obj[k]];
                  });

            entries.forEach(function (entry, idx) {
                var line = document.createElement("div");
                var keySpan = span(
                    isArray ? String(entry[0]) : '"' + esc(String(entry[0])) + '"',
                    "json-key"
                );
                attachCopyMenu(keySpan, entry[1]);
                line.appendChild(keySpan);
                line.appendChild(span(": ", "json-bracket"));
                buildJsonTree(entry[1], line, depth + 1, nodeList, expandAllState);
                if (idx < entries.length - 1) {
                    line.appendChild(span(",", "json-bracket"));
                }
                childContainer.appendChild(line);
            });
        }

        toggle.addEventListener("click", function () {
            setExpanded(!expanded);
        });

        // Right-click on toggle or bracket copies the whole object/array
        attachCopyMenu(toggle, obj);
        attachCopyMenu(preview, obj);

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
                "<td>" +
                esc(p.id) +
                "</td>" +
                "<td>" +
                esc(p.parent || "(root)") +
                "</td>" +
                "<td>" +
                esc(p.name) +
                "</td>" +
                "<td>" +
                esc(formatValue(p.value)) +
                "</td>" +
                "<td>" +
                (p.array ? "true" : "") +
                "</td>";
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

    // ── Clipboard ──────────────────────────────────────────────────
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(function () {
            // Fallback for environments where clipboard API isn't available
            var ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        });
    }

    // ── Context menu ────────────────────────────────────────────────
    var ctxMenu = null;

    function showContextMenu(e, value) {
        e.preventDefault();
        hideContextMenu();

        ctxMenu = document.createElement("div");
        ctxMenu.className = "ctx-menu";

        var copyItem = document.createElement("div");
        copyItem.className = "ctx-menu-item";
        copyItem.textContent = "Copy value";
        copyItem.addEventListener("click", function () {
            var text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
            copyToClipboard(text);
            hideContextMenu();
        });
        ctxMenu.appendChild(copyItem);

        var copyCompactItem = document.createElement("div");
        copyCompactItem.className = "ctx-menu-item";
        copyCompactItem.textContent = "Copy value (compact)";
        copyCompactItem.addEventListener("click", function () {
            var text = typeof value === "string" ? value : JSON.stringify(value);
            copyToClipboard(text);
            hideContextMenu();
        });
        ctxMenu.appendChild(copyCompactItem);

        document.body.appendChild(ctxMenu);

        // Position near cursor, but keep within viewport
        var x = e.clientX;
        var y = e.clientY;
        var menuW = ctxMenu.offsetWidth;
        var menuH = ctxMenu.offsetHeight;
        if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 4;
        if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 4;
        ctxMenu.style.left = x + "px";
        ctxMenu.style.top = y + "px";
    }

    function hideContextMenu() {
        if (ctxMenu && ctxMenu.parentNode) {
            ctxMenu.parentNode.removeChild(ctxMenu);
        }
        ctxMenu = null;
    }

    document.addEventListener("click", hideContextMenu);
    document.addEventListener("contextmenu", function (e) {
        // Only hide if clicking outside a json-tree area (let our handler take over)
        if (ctxMenu && !e.target.closest(".json-tree")) {
            hideContextMenu();
        }
    });

    function attachCopyMenu(el, value) {
        el.addEventListener("contextmenu", function (e) {
            showContextMenu(e, value);
        });
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
