/**
 * Getting popups, consent banners and overlays out of the way — see the design brief, section 10.4.
 *
 * This is one pass, not two. It began as consent-banner dismissal and grew to cover the overlays that
 * arrive later — newsletter modals, promo interstitials, exit-intent layers — because two passes over
 * the same elements is how earlier bugs in this area drifted: one of them would be tightened and the
 * other would keep matching, and the page would come back different depending on which ran last.
 *
 * Three rules hold the whole thing together.
 *
 * We hide consent banners; we do not click "Accept". Clicking accept consents to tracking on a third
 * party's behalf, which is not ours to give from a crawler, and it is also wrong technically:
 * accepting loads the tag managers and A/B scripts the banner was gating, and those rewrite the very
 * colours and fonts we are here to measure. Hiding leaves the page as the site's own design intended.
 *
 * Everything else we try to close the way a visitor would, using the overlay's own close control —
 * never a button that agrees to anything. Closing a newsletter modal grants nobody consent.
 *
 * What resists closing is removed, and only on criteria all of which must hold at once. A removed
 * header is a worse outcome than a surviving popup: the popup costs one page its fidelity, a missing
 * header costs the component that would have been built from it, on every page of the site. The
 * conditions below are therefore deliberately too strict rather than nearly right, and the centre
 * test is the one doing the real work — a header, a cookie bar and a chat bubble all fail it by
 * construction, because none of them is in the middle of the screen.
 *
 * Like `samplePageScript`, this is a self-contained script string: it runs in the page and cannot
 * reach our module graph. It is also idempotent, because it runs twice — once before sampling and
 * once immediately before the screenshots — and a second run over a cleared page must be a no-op.
 */

export type { OverlayClearanceResult } from "~/abstractions.js";

/**
 * Vendor containers, matched exactly.
 *
 * A known selector is safer than any heuristic, so these run first and the heuristic below only has
 * to catch the bespoke ones.
 */
export const KNOWN_BANNER_SELECTORS = [
    "#onetrust-consent-sdk",
    "#onetrust-banner-sdk",
    "#CybotCookiebotDialog",
    "#cookiebanner",
    ".osano-cm-window",
    ".qc-cmp2-container",
    "#truste-consent-track",
    "#termly-code-snippet-support",
    "#iubenda-cs-banner",
    ".cky-consent-container",
    "#BorlabsCookieBox",
    "#cmplz-cookiebanner-container",
    "#usercentrics-root",
    "#didomi-host",
    ".cc-window",
    "#hs-eu-cookie-confirmation",
    "#klaro",
    ".cookie-consent-banner"
] as const;

/**
 * Words that identify a consent element when no known selector matched.
 *
 * Matched against an element's id, class list and its own text — never against a descendant's text,
 * or a page whose article mentions cookies would take its own body out.
 */
export const BANNER_KEYWORDS = [
    "cookie",
    "consent",
    "gdpr",
    "ccpa",
    "privacy-banner",
    "cookiebanner",
    "cookie-notice"
] as const;

/**
 * Accessible names that identify a control which closes the overlay and nothing else.
 *
 * Deliberately narrow. Anything ambiguous belongs in neither list and simply goes unclicked, which
 * leaves the overlay to the removal pass — a worse outcome than closing it, but a safe one.
 */
export const CLOSE_LABELS = [
    "close",
    "dismiss",
    "no thanks",
    "no, thanks",
    "not now",
    "maybe later",
    "×",
    "✕",
    "✖",
    "x"
] as const;

/**
 * Accessible names that must never be clicked.
 *
 * Checked before the close list, so a control labelled "Close and accept" is left alone. These agree
 * to something on the visitor's behalf, and a crawler has nothing to agree with.
 */
export const CONSENT_LABELS = [
    "accept",
    "agree",
    "allow",
    "consent",
    "got it",
    "ok",
    "okay",
    "continue",
    "subscribe",
    "sign up",
    "yes"
] as const;

/**
 * How much of the viewport's middle third an element must cover to count as sitting over the page.
 *
 * The middle third rather than the whole viewport, because that is what separates a popup from the
 * furniture: a header spans the full width but stops well above the middle, a cookie bar sits below
 * it, a chat bubble is in a corner. An element has to reach into the centre of the screen to pass,
 * which is precisely what a popup does and what a header, by construction, does not.
 */
const CENTRE_COVERAGE = 0.6;

/** The floor for a deliberate overlay layer. Page furniture lives well below this. */
const OVERLAY_Z_INDEX = 100;

export const clearOverlaysScript = (): string => {
    const knownSelectors = JSON.stringify(KNOWN_BANNER_SELECTORS);
    const keywords = JSON.stringify(BANNER_KEYWORDS);
    const closeLabels = JSON.stringify(CLOSE_LABELS);
    const consentLabels = JSON.stringify(CONSENT_LABELS);

    return `(() => {
    const KNOWN = ${knownSelectors};
    const KEYWORDS = ${keywords};
    const CLOSE_LABELS = ${closeLabels};
    const CONSENT_LABELS = ${consentLabels};
    const CENTRE_COVERAGE = ${CENTRE_COVERAGE};
    const OVERLAY_Z_INDEX = ${OVERLAY_Z_INDEX};

    const hidden = [];
    const dismissed = [];
    const removed = [];

    const all = () => document.body ? document.body.querySelectorAll("*") : [];

    const hide = (element, description, into) => {
        if (!element || !element.style) {
            return false;
        }
        element.style.setProperty("display", "none", "important");
        into.push(description);
        return true;
    };

    const describe = element => {
        const id = element.id ? "#" + element.id : "";
        const className = typeof element.className === "string" && element.className.trim()
            ? "." + element.className.trim().split(/\\s+/).slice(0, 2).join(".")
            : "";
        return element.tagName.toLowerCase() + id + className;
    };

    // ---- consent banners: hidden, never accepted ----

    for (const selector of KNOWN) {
        for (const element of document.querySelectorAll(selector)) {
            hide(element, selector, hidden);
        }
    }

    // Own text only: a descendant's text would let an article about cookies match its own <main>.
    const ownText = element => {
        let text = "";
        for (const node of element.childNodes) {
            if (node.nodeType === 3) {
                text += node.textContent || "";
            }
        }
        return text.toLowerCase();
    };

    const looksLikeConsent = element => {
        const id = (element.id || "").toLowerCase();
        const className = typeof element.className === "string" ? element.className.toLowerCase() : "";
        const haystack = id + " " + className;

        for (const keyword of KEYWORDS) {
            if (haystack.includes(keyword)) {
                return keyword;
            }
        }

        // Fall back to text, but only for the small banner-sized elements — this keeps the check away
        // from page-level wrappers.
        const text = ownText(element);
        if (text.length > 0 && text.length < 400) {
            for (const keyword of KEYWORDS) {
                if (text.includes(keyword)) {
                    return keyword;
                }
            }
        }

        return null;
    };

    // Only pinned elements are candidates. A consent notice that scrolls away with the document is
    // not covering anything and is part of the page's real design.
    for (const element of all()) {
        const style = window.getComputedStyle(element);
        if (style.position !== "fixed" && style.position !== "sticky") {
            continue;
        }
        if (style.display === "none" || style.visibility === "hidden") {
            continue;
        }

        const keyword = looksLikeConsent(element);
        if (keyword) {
            hide(element, "[" + style.position + " element matching '" + keyword + "']", hidden);
        }
    }

    // ---- the overlay test ----

    /*
     * The middle third of the viewport. Everything below measures against this box rather than
     * against the viewport as a whole.
     */
    const centre = {
        left: window.innerWidth / 3,
        right: (window.innerWidth * 2) / 3,
        top: window.innerHeight / 3,
        bottom: (window.innerHeight * 2) / 3
    };
    const centreArea = (centre.right - centre.left) * (centre.bottom - centre.top);
    const centreX = window.innerWidth / 2;
    const centreY = window.innerHeight / 2;

    const centreCoverage = element => {
        const rect = element.getBoundingClientRect();
        const width = Math.min(rect.right, centre.right) - Math.max(rect.left, centre.left);
        const height = Math.min(rect.bottom, centre.bottom) - Math.max(rect.top, centre.top);
        if (width <= 0 || height <= 0 || centreArea <= 0) {
            return 0;
        }
        return (width * height) / centreArea;
    };

    /*
     * A child of a stacked container paints above the page while its own z-index reads "auto", so the
     * effective value is the nearest positioned ancestor's.
     */
    const effectiveZIndex = element => {
        let node = element;
        while (node && node !== document.documentElement) {
            const style = window.getComputedStyle(node);
            if (style.position !== "static") {
                const z = parseInt(style.zIndex, 10);
                if (!isNaN(z)) {
                    return z;
                }
            }
            node = node.parentElement;
        }
        return 0;
    };

    /*
     * What the visitor actually sees at the centre of the screen. This narrows the test and never
     * widens it: an element can satisfy every measurement above and still sit behind something else,
     * and the thing in front is the one worth acting on.
     */
    const coversCentrePoint = element => {
        const hit = document.elementFromPoint(centreX, centreY);
        return !!hit && (hit === element || element.contains(hit));
    };

    /*
     * All three conditions, and the hit test. Any one of them alone matches page furniture; together
     * they describe something deliberately laid over the middle of the page.
     */
    const isOverlay = element => {
        const style = window.getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
            return false;
        }
        if (style.position !== "fixed" && style.position !== "absolute") {
            return false;
        }
        if (centreCoverage(element) < CENTRE_COVERAGE) {
            return false;
        }
        if (effectiveZIndex(element) < OVERLAY_Z_INDEX) {
            return false;
        }
        return coversCentrePoint(element);
    };

    const overlays = () => {
        const found = [];
        for (const element of all()) {
            if (isOverlay(element)) {
                found.push(element);
            }
        }
        /*
         * Outermost first, and nested ones dropped: acting on a modal's inner panel leaves its own
         * wrapper standing, and counts one popup as several.
         */
        return found.filter(element => {
            return !found.some(other => other !== element && other.contains(element));
        });
    };

    // ---- dismissal: close it the way a visitor would ----

    const accessibleName = element => {
        const label = element.getAttribute("aria-label") || element.getAttribute("title") || "";
        const text = (element.textContent || "").trim();
        return (label + " " + text).trim().toLowerCase().slice(0, 80);
    };

    const isCloseControl = element => {
        const name = accessibleName(element);
        if (!name) {
            return false;
        }
        // Checked first, so "Close and accept" is left alone.
        for (const label of CONSENT_LABELS) {
            if (name.includes(label)) {
                return false;
            }
        }
        for (const label of CLOSE_LABELS) {
            if (name === label || name.startsWith(label + " ") || name.endsWith(" " + label)) {
                return true;
            }
        }
        return false;
    };

    const closeControlIn = element => {
        const candidates = element.querySelectorAll("button, a, [role='button'], [aria-label]");
        for (const candidate of candidates) {
            if (isCloseControl(candidate)) {
                return candidate;
            }
        }
        return null;
    };

    for (const overlay of overlays()) {
        const control = closeControlIn(overlay);
        if (!control) {
            continue;
        }
        try {
            control.click();
            dismissed.push(describe(overlay) + " via '" + accessibleName(control) + "'");
        } catch (error) {
            // A close handler that throws is the overlay's problem; the removal pass still catches it.
        }
    }

    /*
     * Escape after the close controls, for the libraries that listen for it and expose no button. The
     * event is synthetic, so a handler checking isTrusted will ignore it — best effort, and what it
     * misses the removal pass takes.
     */
    if (overlays().length > 0) {
        for (const type of ["keydown", "keyup"]) {
            document.dispatchEvent(new KeyboardEvent(type, {
                key: "Escape",
                code: "Escape",
                keyCode: 27,
                which: 27,
                bubbles: true,
                cancelable: true
            }));
        }
    }

    // ---- removal: what resisted ----

    /*
     * Third-party iframes that sit over the page go wholesale. Hiding is not enough for these: the
     * frame keeps running, and a promo widget that re-shows itself on a timer is back before the
     * screenshot. A same-origin frame is
     * left to the pass below, which hides it like any other overlay: it is the site's own, and an
     * embedded map or form in the page flow never meets the criteria in the first place.
     */
    for (const frame of document.querySelectorAll("iframe")) {
        const src = frame.getAttribute("src") || "";
        let host = "";
        try {
            host = src ? new URL(src, window.location.href).host : "";
        } catch (error) {
            host = "";
        }
        if (!host || host === window.location.host) {
            continue;
        }
        if (!isOverlay(frame)) {
            continue;
        }
        removed.push(describe(frame) + " (third-party overlay iframe, " + host + ")");
        frame.remove();
    }

    for (const overlay of overlays()) {
        const style = window.getComputedStyle(overlay);
        const reason = style.position
            + ", covers " + Math.round(centreCoverage(overlay) * 100) + "% of the viewport centre"
            + ", z-index " + effectiveZIndex(overlay);
        hide(overlay, describe(overlay) + " (" + reason + ")", removed);
    }

    /*
     * The backdrop, separately. It is a sibling of the dialog rather than a part of it, so removing
     * the dialog on its own leaves the page dimmed and unreadable — and a screenshot of a grey sheet
     * segments into nothing. Fixed only, and text-free: that excludes a full-bleed hero, which is the
     * thing this must never take.
     */
    const viewportArea = window.innerWidth * window.innerHeight;
    for (const element of all()) {
        const style = window.getComputedStyle(element);
        if (style.position !== "fixed" || style.display === "none" || style.visibility === "hidden") {
            continue;
        }
        const rect = element.getBoundingClientRect();
        if (rect.width * rect.height < viewportArea * 0.9) {
            continue;
        }
        if (effectiveZIndex(element) < OVERLAY_Z_INDEX) {
            continue;
        }
        if (ownText(element).trim().length > 0) {
            continue;
        }
        /*
         * Nothing visible inside it. A backdrop is either a bare sibling of the dialog or the wrapper
         * the dialog sits in — and in the second case the dialog has just been hidden above, so the
         * wrapper is empty by the time we get here. An overlay that still has visible content is
         * content, and is left standing.
         */
        const stillShowing = Array.prototype.some.call(element.children, child => {
            return window.getComputedStyle(child).display !== "none";
        });
        if (stillShowing) {
            continue;
        }
        const tinted = style.backgroundColor !== "rgba(0, 0, 0, 0)"
            && style.backgroundColor !== "transparent"
            && style.backgroundColor !== "";
        const blurred = !!style.backdropFilter && style.backdropFilter !== "none";
        if (!tinted && !blurred) {
            continue;
        }
        hide(element, describe(element) + " (full-viewport backdrop)", removed);
    }

    // ---- scrolling ----

    /*
     * Overlays commonly lock scrolling, and the lock outlives them: the page stays frozen at the top,
     * every below-the-fold screenshot comes back identical to the first, and nothing errors. Restored
     * unconditionally, because by this point whatever set it is gone.
     */
    let unlockedScroll = false;
    for (const element of [document.documentElement, document.body]) {
        if (!element) {
            continue;
        }
        const style = window.getComputedStyle(element);
        if (style.overflow === "hidden" || style.overflowY === "hidden") {
            element.style.setProperty("overflow", "auto", "important");
            unlockedScroll = true;
        }
        if (style.position === "fixed") {
            element.style.setProperty("position", "static", "important");
            unlockedScroll = true;
        }
        if (style.touchAction === "none") {
            element.style.setProperty("touch-action", "auto", "important");
            unlockedScroll = true;
        }
    }

    // ---- what is left ----

    /*
     * Cheap, and the only honest way to report the result: the pass either cleared the page or it did
     * not, and a capture that still has something over it should say so rather than be assumed clean.
     *
     * This is the single check. It deliberately asks two questions, because the clearance leaves two
     * different kinds of survivor and only one of them is in the middle of the screen: a modal that
     * resisted both closing and removal, and a consent bar pinned along an edge — which fails the
     * centre test by design, is right not to be removed, and still sits in the photograph.
     *
     * It lives here, next to the code that did the clearing, so the two cannot disagree about what
     * happened. An independent detector elsewhere would be a second opinion on a question that already
     * has an authoritative answer.
     */
    let overlayRemains = null;
    const survivors = overlays();
    if (survivors.length > 0) {
        overlayRemains = describe(survivors[0])
            + " (covers " + Math.round(centreCoverage(survivors[0]) * 100) + "% of the viewport centre)";
    } else {
        for (const element of all()) {
            const style = window.getComputedStyle(element);
            if (style.position !== "fixed" && style.position !== "sticky") {
                continue;
            }
            if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
                continue;
            }
            const rect = element.getBoundingClientRect();
            if (rect.width < 100 || rect.height < 40) {
                continue;
            }
            const keyword = looksLikeConsent(element);
            if (keyword) {
                overlayRemains = describe(element) + " (pinned, still matching '" + keyword + "')";
                break;
            }
        }
    }

    return { hidden, dismissed, removed, unlockedScroll, overlayRemains };
})()`;
};
