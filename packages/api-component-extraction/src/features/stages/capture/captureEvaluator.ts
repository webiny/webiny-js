/**
 * The in-page evaluator for Capture — the pluggable seam `@webiny/site-capture` runs after its visit
 * sequence. Returned as a self-contained script string (no imports; it executes in the page against
 * arbitrary third-party HTML, so it is defensive and node-capped).
 *
 * It produces a pruned element tree (tag, document-space geometry, a token-relevant computed-style
 * subset, direct text, children — skipping invisible and zero-area nodes), the document height, and the
 * raw serialised DOM. Geometry is in document coordinates: the tree is read before any screenshot
 * scroll, at scroll 0, so `getBoundingClientRect` already gives document offsets.
 */
export interface CaptureEvalResult {
    tree: unknown;
    documentHeight: number;
    rawDom: string;
    /** The page's `<title>`, so the capture grid reads by name rather than by cryptic path. */
    title: string;
    /** `<img>` elements at capture time: how many are broken (loaded, zero natural size) out of the total. */
    imagesTotal: number;
    imagesBroken: number;
}

export const captureEvaluator = (options: { maxNodes: number }): string => {
    const maxNodes = Number.isFinite(options.maxNodes) ? options.maxNodes : 4000;

    return `(() => {
        var MAX = ${maxNodes};
        var count = 0;
        // position is here for segmentation, not for tokens: a fixed or sticky header is painted over
        // the content rather than stacked above it, and its box cannot say so on its own.
        // overflow likewise: whether an element's content can be drawn outside its box, which decides
        // what a section's crop has to include.
        var STYLE_PROPS = ["backgroundColor","color","fontFamily","fontSize","fontWeight","lineHeight","letterSpacing","borderTopColor","borderTopWidth","borderRadius","boxShadow","paddingTop","paddingLeft","marginTop","gap","display","textAlign","position","overflow"];
        var SKIP = { SCRIPT:1, STYLE:1, NOSCRIPT:1, TEMPLATE:1, SVG:1, PATH:1, LINK:1, META:1, HEAD:1, BR:1 };

        /*
         * A CSS background image, and the three properties that decide how it covers its box.
         *
         * Only a \`url(...)\` counts. A gradient is also a background image, and it may be translucent,
         * so it does not establish that the colour underneath is invisible — which is the question
         * this answers. The computed value is already an absolute URL.
         *
         * Read here rather than added to STYLE_PROPS: most elements have no background image, and
         * four more entries on every node's styles would grow every tree to record an absence.
         */
        function backgroundImage(cs) {
            var value = "";
            try { value = cs.backgroundImage || ""; } catch (e) { return null; }
            if (!value || value === "none" || value.indexOf("url(") === -1) { return null; }
            var match = /url\\((['"]?)(.*?)\\1\\)/.exec(value);
            if (!match || !match[2]) { return null; }
            var out = { url: match[2].slice(0, URL_CAP) };
            try { if (cs.backgroundSize) { out.size = cs.backgroundSize.slice(0, CSS_CAP); } } catch (e) {}
            try { if (cs.backgroundPosition) { out.position = cs.backgroundPosition.slice(0, CSS_CAP); } } catch (e) {}
            try { if (cs.backgroundRepeat) { out.repeat = cs.backgroundRepeat.slice(0, CSS_CAP); } } catch (e) {}
            return out;
        }
        var MEDIA = { IMG:1, SOURCE:1, VIDEO:1, IFRAME:1, EMBED:1 };

        /*
         * An element's own text, as one string and as the runs it is actually made of.
         *
         * A paragraph like <p>By submitting this form, you agree to the <a>privacy policy</a>.</p> has
         * two direct text runs with a link between them. Concatenating them yields "By submitting this
         * form, you agree to the ." — a string with a stray space and period that the page never
         * displays, and that nothing downstream can reproduce. Requiring a generated component to
         * contain it is requiring text that does not exist.
         *
         * So the runs are kept alongside the joined form. text is unchanged for every existing
         * reader; textRuns is present only when an element's text was interrupted, and is what the
         * section digest uses to build the fragments a validator checks.
         */
        function directTextRuns(el) {
            var runs = [];
            var current = "";
            for (var i = 0; i < el.childNodes.length; i++) {
                var n = el.childNodes[i];
                if (n.nodeType === 3) {
                    current += n.nodeValue;
                } else if (n.nodeType === 1 && !SKIP[n.tagName]) {
                    // An element between text runs breaks them apart.
                    var done = current.replace(/\\s+/g, " ").trim();
                    if (done) { runs.push(done); }
                    current = "";
                }
            }
            var tail = current.replace(/\\s+/g, " ").trim();
            if (tail) { runs.push(tail); }
            return runs;
        }

        function directText(el) {
            var t = "";
            for (var i = 0; i < el.childNodes.length; i++) {
                var n = el.childNodes[i];
                if (n.nodeType === 3) { t += n.nodeValue; }
            }
            return t.replace(/\\s+/g, " ").trim();
        }

        // A link's destination and a media node's source, read from the DOM PROPERTY rather than the
        // attribute so the browser resolves them to absolute URLs for us — a relative "/pricing" and
        // an absolute "https://site/pricing" then compare as the same page with no resolution step
        // downstream. \`currentSrc\` is preferred for images so a srcset picks the source actually used.
        // Capped because a data: URI can otherwise be megabytes, and one page's tree holds thousands
        // of nodes.
        var URL_CAP = ${1000};
        var CSS_CAP = ${60};
        var ALT_CAP = ${300};

        function linkDestination(el) {
            try {
                if (el.tagName !== "A" && el.tagName !== "AREA") { return ""; }
                return (el.href || "").slice(0, URL_CAP);
            } catch (e) { return ""; }
        }

        function mediaSource(el) {
            try {
                if (MEDIA[el.tagName] !== 1) { return ""; }
                return (el.currentSrc || el.src || "").slice(0, URL_CAP);
            } catch (e) { return ""; }
        }

        function alternativeText(el) {
            try {
                return typeof el.alt === "string" ? el.alt.replace(/\\s+/g, " ").trim().slice(0, ALT_CAP) : "";
            } catch (e) { return ""; }
        }

        // The union of the boxes of the children that survived — where a zero-area element's content
        // actually is, as opposed to where the browser said the element was.
        function unionBox(children) {
            var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (var i = 0; i < children.length; i++) {
                var b = children[i].box;
                if (b.x < minX) { minX = b.x; }
                if (b.y < minY) { minY = b.y; }
                if (b.x + b.width > maxX) { maxX = b.x + b.width; }
                if (b.y + b.height > maxY) { maxY = b.y + b.height; }
            }
            return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }

        function clips(cs) {
            var values = [cs.overflow, cs.overflowX, cs.overflowY];
            for (var i = 0; i < values.length; i++) {
                if (values[i] && values[i] !== "visible") { return true; }
            }
            return false;
        }

        /*
         * An icon drawn by an icon font: a pseudo-element whose content is a single private-use
         * character (U+E000-U+F8FF), the code points icon fonts draw their glyphs at.
         *
         * It is invisible to everything else read here: no image, no text, no URL. A footer's social
         * links were 50x50 boxes with nothing in them, so the icons were gone from the migration with
         * every check green. The glyph itself means nothing without the page's font, so what is
         * recorded is what the icon is for — the link's accessible name — for Generate to draw.
         * Read only on small elements: a pseudo-element style read on every node of a large page is
         * not free, and an icon is small.
         */
        var ICON_MAX = 96;
        function iconOf(el, width, height) {
            if (width > ICON_MAX || height > ICON_MAX) { return null; }
            var glyph = "";
            var pseudo = ["::before", "::after"];
            for (var i = 0; i < pseudo.length && !glyph; i++) {
                var content = "";
                try { content = window.getComputedStyle(el, pseudo[i]).content || ""; } catch (e) {}
                var raw = content.replace(/^["']|["']$/g, "");
                if (raw.length === 1) {
                    var code = raw.charCodeAt(0);
                    if (code >= 0xe000 && code <= 0xf8ff) { glyph = code.toString(16); }
                }
            }
            if (!glyph) { return null; }
            /*
             * Named by what a reader is told it is: the accessible name of the control it sits in,
             * else an icon class (fa-map-marker, icon-instagram). An icon with neither is a chevron
             * or an ornament, not content, and is left out rather than labelled with layout classes.
             */
            var named = el.closest ? el.closest("a,button,[aria-label],[title]") : null;
            var label = "";
            try {
                if (named) { label = named.getAttribute("aria-label") || named.getAttribute("title") || ""; }
                if (!label) {
                    var classes = (String(el.className || "") + " " + String((named && named.className) || "")).split(/\\s+/);
                    for (var c = 0; c < classes.length && !label; c++) {
                        var m = /^(?:fa|icon|glyphicon|bi)-([a-z0-9-]+)$/i.exec(classes[c]);
                        if (m) { label = m[1].replace(/-/g, " "); }
                    }
                }
            } catch (e) {}
            if (!label) { return null; }
            return { glyph: glyph, label: label.slice(0, ALT_CAP) };
        }

        function walk(el) {
            if (count >= MAX || !el || el.nodeType !== 1 || SKIP[el.tagName]) { return null; }
            var cs = window.getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden") { return null; }
            /*
             * Transparent is hidden too. A closed menu is commonly an opacity:0 layer laid out under
             * the header — on 2424 Tulane, its navigation, address and hours sat 645px down the page
             * at opacity 0 — and reading it as content made Generate build the open menu into the
             * header. Entrance animations also start at 0, but the visit sequence has finished them
             * by now, so what is still at 0 is meant to be.
             */
            if (parseFloat(cs.opacity) === 0) { return null; }
            var rect = el.getBoundingClientRect();
            var width = Math.round(rect.width), height = Math.round(rect.height);

            /*
             * A zero-area box used to prune the whole subtree, which discarded rendered content: a
             * zero-height position:absolute flex wrapper around a 1300x60 navigation bar took 66
             * descendants and 19 links with it, on every page of one site — measured at 1/11 pages
             * carrying a header where the real answer is 11/11. Zero-height wrappers around positioned
             * content are an ordinary CSS pattern (absolute headers, flex containers with out-of-flow
             * children, sticky bars built as overlays, carousel tracks escaping their rail), and they
             * skew toward the elements worth migrating, because those are the ones built as overlays.
             *
             * The element is not absent — its box is wrong. So the node is kept and its box is derived
             * from its children, marked boxDerived so a reader downstream can tell an inference from a
             * measurement. A wrapper whose subtree is genuinely empty has nothing to derive from and
             * keeps the old treatment: it is dropped, because a wrapper around nothing is nothing. Across
             * six sites, 91% of zero-area nodes are that case.
             */
            var zeroArea = width <= 0 || height <= 0;

            /*
             * Except a zero-area box that clips: nothing inside it can be seen. The derived box above
             * is for wrappers whose content escapes them (overflow visible); a collapsed drawer —
             * width 0, overflow hidden — has the same zero box and content that does not escape. Kept,
             * it handed the closed menu a box and the menu became content.
             */
            if (zeroArea && clips(cs)) { return null; }

            if (!zeroArea) { count++; }

            // Children first, so a chain of zero-area wrappers resolves from the inside out and a
            // repaired child already carries a real box when its parent takes the union.
            var children = [];
            for (var j = 0; j < el.children.length; j++) {
                var c = walk(el.children[j]);
                if (c) { children.push(c); }
            }

            if (zeroArea) {
                if (!children.length || count >= MAX) { return null; }
                count++;
            }

            var styles = {};
            for (var i = 0; i < STYLE_PROPS.length; i++) {
                try { styles[STYLE_PROPS[i]] = cs[STYLE_PROPS[i]]; } catch (e) {}
            }
            var node = {
                tag: el.tagName.toLowerCase(),
                box: zeroArea ? unionBox(children) : {
                    x: Math.round(rect.x + window.scrollX),
                    y: Math.round(rect.y + window.scrollY),
                    width: width,
                    height: height
                },
                styles: styles,
                children: children
            };
            if (zeroArea) { node.boxDerived = true; }
            var text = directText(el);
            if (text) { node.text = text.slice(0, 2000); }
            var runs = directTextRuns(el);
            if (runs.length > 1) { node.textRuns = runs.map(function (r) { return r.slice(0, 2000); }); }
            // Only set when present, like \`text\` — an absent field keeps the tree small and keeps a
            // node's shape identical to what earlier runs produced.
            var href = linkDestination(el);
            if (href) { node.href = href; }
            var background = backgroundImage(cs);
            if (background) { node.background = background; }
            var src = mediaSource(el);
            if (src) { node.src = src; }
            var alt = alternativeText(el);
            if (alt) { node.alt = alt; }
            var icon = iconOf(el, width, height);
            if (icon) { node.icon = icon; }
            return node;
        }

        // Broken images: loaded (complete) but zero natural size. Lazy images not yet loaded have
        // complete === false, so they are not miscounted as broken.
        function imageStats() {
            try {
                var imgs = document.images || [];
                var broken = 0;
                for (var i = 0; i < imgs.length; i++) {
                    if (imgs[i].complete && imgs[i].naturalWidth === 0) { broken++; }
                }
                return { total: imgs.length, broken: broken };
            } catch (e) { return { total: 0, broken: 0 }; }
        }

        var root = document.body ? walk(document.body) : null;
        var stats = imageStats();
        return {
            tree: root,
            documentHeight: document.body ? document.body.scrollHeight : 0,
            rawDom: document.documentElement ? document.documentElement.outerHTML : "",
            title: (document.title || "").slice(0, 300),
            imagesTotal: stats.total,
            imagesBroken: stats.broken
        };
    })()`;
};
