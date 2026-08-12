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
}

export const captureEvaluator = (options: { maxNodes: number }): string => {
    const maxNodes = Number.isFinite(options.maxNodes) ? options.maxNodes : 4000;

    return `(() => {
        var MAX = ${maxNodes};
        var count = 0;
        var STYLE_PROPS = ["backgroundColor","color","fontFamily","fontSize","fontWeight","lineHeight","letterSpacing","borderTopColor","borderTopWidth","borderRadius","boxShadow","paddingTop","paddingLeft","marginTop","gap","display","textAlign"];
        var SKIP = { SCRIPT:1, STYLE:1, NOSCRIPT:1, TEMPLATE:1, SVG:1, PATH:1, LINK:1, META:1, HEAD:1, BR:1 };

        function directText(el) {
            var t = "";
            for (var i = 0; i < el.childNodes.length; i++) {
                var n = el.childNodes[i];
                if (n.nodeType === 3) { t += n.nodeValue; }
            }
            return t.replace(/\\s+/g, " ").trim();
        }

        function walk(el) {
            if (count >= MAX || !el || el.nodeType !== 1 || SKIP[el.tagName]) { return null; }
            var cs = window.getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden") { return null; }
            var rect = el.getBoundingClientRect();
            var width = Math.round(rect.width), height = Math.round(rect.height);
            if (width <= 0 || height <= 0) { return null; }

            count++;
            var styles = {};
            for (var i = 0; i < STYLE_PROPS.length; i++) {
                try { styles[STYLE_PROPS[i]] = cs[STYLE_PROPS[i]]; } catch (e) {}
            }
            var children = [];
            for (var j = 0; j < el.children.length; j++) {
                var c = walk(el.children[j]);
                if (c) { children.push(c); }
            }
            var node = {
                tag: el.tagName.toLowerCase(),
                box: {
                    x: Math.round(rect.x + window.scrollX),
                    y: Math.round(rect.y + window.scrollY),
                    width: width,
                    height: height
                },
                styles: styles,
                children: children
            };
            var text = directText(el);
            if (text) { node.text = text.slice(0, 2000); }
            return node;
        }

        var root = document.body ? walk(document.body) : null;
        return {
            tree: root,
            documentHeight: document.body ? document.body.scrollHeight : 0,
            rawDom: document.documentElement ? document.documentElement.outerHTML : ""
        };
    })()`;
};
