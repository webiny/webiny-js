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
    /** A cookie/consent overlay was still present after the browser's visit sequence (dismissal failed). */
    consentPresent: boolean;
    /** `<img>` elements at capture time: how many are broken (loaded, zero natural size) out of the total. */
    imagesTotal: number;
    imagesBroken: number;
}

export const captureEvaluator = (options: { maxNodes: number }): string => {
    const maxNodes = Number.isFinite(options.maxNodes) ? options.maxNodes : 4000;

    return `(() => {
        var MAX = ${maxNodes};
        var count = 0;
        var STYLE_PROPS = ["backgroundColor","color","fontFamily","fontSize","fontWeight","lineHeight","letterSpacing","borderTopColor","borderTopWidth","borderRadius","boxShadow","paddingTop","paddingLeft","marginTop","gap","display","textAlign"];
        var SKIP = { SCRIPT:1, STYLE:1, NOSCRIPT:1, TEMPLATE:1, SVG:1, PATH:1, LINK:1, META:1, HEAD:1, BR:1 };
        var MEDIA = { IMG:1, SOURCE:1, VIDEO:1, IFRAME:1, EMBED:1 };

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
            // Only set when present, like \`text\` — an absent field keeps the tree small and keeps a
            // node's shape identical to what earlier runs produced.
            var href = linkDestination(el);
            if (href) { node.href = href; }
            var src = mediaSource(el);
            if (src) { node.src = src; }
            var alt = alternativeText(el);
            if (alt) { node.alt = alt; }
            return node;
        }

        // A cookie/consent overlay still on the page means the browser's dismissal did not take — the
        // captured screenshot has a banner across it. Heuristic: a visible, banner-sized element whose id/
        // class or text reads as consent. Defensive: any failure just reports "no banner".
        function detectConsent() {
            try {
                var SELECTORS = ['[id*="cookie" i]','[class*="cookie" i]','[id*="consent" i]','[class*="consent" i]','[id*="gdpr" i]','[class*="gdpr" i]','[aria-label*="cookie" i]','#onetrust-banner-sdk','#CybotCookiebotDialog','[class*="cmp" i]'];
                var KEYWORDS = /cookie|consent|gdpr|privacy|accept all|we use/i;
                var nodes = document.querySelectorAll(SELECTORS.join(","));
                for (var i = 0; i < nodes.length; i++) {
                    var el = nodes[i];
                    var cs = window.getComputedStyle(el);
                    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") { continue; }
                    if (el.offsetParent === null && cs.position !== "fixed") { continue; }
                    var rect = el.getBoundingClientRect();
                    if (rect.width < 100 || rect.height < 40) { continue; }
                    var idClass = (el.id || "") + " " + (typeof el.className === "string" ? el.className : "");
                    var text = (el.innerText || "").slice(0, 400);
                    if (KEYWORDS.test(text) || /onetrust|cookiebot/i.test(idClass)) { return true; }
                }
                return false;
            } catch (e) { return false; }
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
            consentPresent: detectConsent(),
            imagesTotal: stats.total,
            imagesBroken: stats.broken
        };
    })()`;
};
