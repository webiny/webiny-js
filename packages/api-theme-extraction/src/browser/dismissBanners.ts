/**
 * Getting consent banners out of the way — see the design brief, section 10.4.
 *
 * We hide them; we do not click "Accept". That is a deliberate choice on two grounds. Clicking accept
 * consents to tracking on a third party's behalf, which is not ours to give from a crawler. And it is
 * also wrong technically: accepting loads the tag managers and A/B testing scripts the banner was
 * gating, and those rewrite the very colours and fonts we are here to measure. Hiding leaves the page
 * as the site's own design intended it.
 *
 * Banners still have to go, rather than simply be ignored, because they lock body scroll and lay a
 * dimming scrim over everything — which ruins screenshots and hands the scrim's colour a page-sized
 * area weight in the inventory.
 *
 * Like `samplePageScript`, this is a self-contained script string: it runs in the page and cannot
 * reach our module graph.
 */

export interface BannerDismissalResult {
    /** Selectors or descriptions of what was hidden, for the crawl log. */
    hidden: string[];
    /** Whether a scroll lock had to be lifted. */
    unlockedScroll: boolean;
}

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

export const dismissBannersScript = (): string => {
    const knownSelectors = JSON.stringify(KNOWN_BANNER_SELECTORS);
    const keywords = JSON.stringify(BANNER_KEYWORDS);

    return `(() => {
    const KNOWN = ${knownSelectors};
    const KEYWORDS = ${keywords};
    const hidden = [];

    const hide = (element, description) => {
        if (!element || !element.style) {
            return false;
        }
        element.style.setProperty("display", "none", "important");
        hidden.push(description);
        return true;
    };

    for (const selector of KNOWN) {
        for (const element of document.querySelectorAll(selector)) {
            hide(element, selector);
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
    for (const element of document.body ? document.body.querySelectorAll("*") : []) {
        const style = window.getComputedStyle(element);
        if (style.position !== "fixed" && style.position !== "sticky") {
            continue;
        }
        if (style.display === "none" || style.visibility === "hidden") {
            continue;
        }

        const keyword = looksLikeConsent(element);
        if (keyword) {
            hide(element, "[" + style.position + " element matching '" + keyword + "']");
        }
    }

    // Full-page fixed scrims. These rarely carry a usable class name, so they are identified by
    // covering the viewport while being visually inert — and only when a banner was already found,
    // so a legitimate full-bleed hero is never removed.
    if (hidden.length > 0) {
        const viewportArea = window.innerWidth * window.innerHeight;
        for (const element of document.body ? document.body.querySelectorAll("*") : []) {
            const style = window.getComputedStyle(element);
            if (style.position !== "fixed" || style.display === "none") {
                continue;
            }
            const rect = element.getBoundingClientRect();
            if (rect.width * rect.height < viewportArea * 0.9) {
                continue;
            }
            // A scrim has no text of its own; anything that does is content.
            if (ownText(element).trim().length === 0 && element.children.length === 0) {
                hide(element, "[full-viewport scrim]");
            }
        }
    }

    // Banners commonly lock scrolling, which leaves the page frozen at the top and every
    // below-the-fold screenshot identical to the first.
    let unlockedScroll = false;
    for (const element of [document.documentElement, document.body]) {
        if (!element) {
            continue;
        }
        const overflow = window.getComputedStyle(element).overflow;
        if (overflow === "hidden") {
            element.style.setProperty("overflow", "auto", "important");
            unlockedScroll = true;
        }
        if (element.style.position === "fixed") {
            element.style.setProperty("position", "static", "important");
            unlockedScroll = true;
        }
    }

    return { hidden, unlockedScroll };
})()`;
};
