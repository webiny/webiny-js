/**
 * The in-page sampling script — see the design brief, section 10.4.
 *
 * This runs inside the page, not in the Lambda, so it is written as a single self-contained function
 * body with no imports: whatever the browser evaluates cannot reach our module graph. Keep it that
 * way, and keep it defensive — it executes against arbitrary third-party pages.
 *
 * We *filter* the DOM rather than walking it: visible elements with non-zero area that either
 * contain text directly or are interactive. Walking everything on a modern marketing page means
 * tens of thousands of nodes, almost all of them layout wrappers that tell us nothing.
 */

export interface SampleOptions {
    /** Hard cap on sampled elements per page. Above this, sampling is area-weighted. */
    maxElements: number;
}

export interface SampledElement {
    /** Lower-cased tag name, for context when the model reads the inventory. */
    tag: string;
    area: number;
    glyphs: number;
    interactive: boolean;
    backgroundColor: string;
    borderColor: string;
    borderWidth: string;
    borderRadius: string;
    boxShadow: string;
    color: string;
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
    paddingTop: string;
    paddingLeft: string;
    marginTop: string;
    gap: string;
}

export interface SampleResult {
    elements: SampledElement[];
    /** How many candidates matched before the cap was applied, so we can report what we sampled. */
    candidateCount: number;
    links: Array<{ href: string; source: "nav" | "footer" | "body" }>;
}

export const DEFAULT_MAX_ELEMENTS = 1500;

/**
 * Serialised and evaluated in the page. Returned as a string rather than a function reference so the
 * provider can hand it to any driver without depending on that driver's serialisation rules.
 */
export const samplePageScript = (options: SampleOptions): string => {
    const maxElements = Number.isFinite(options.maxElements)
        ? options.maxElements
        : DEFAULT_MAX_ELEMENTS;

    return `(() => {
    const MAX = ${maxElements};
    const INTERACTIVE = new Set(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY", "LABEL"]);

    const directText = element => {
        let text = "";
        for (const node of element.childNodes) {
            if (node.nodeType === 3) {
                text += node.textContent || "";
            }
        }
        return text.trim();
    };

    const linkSource = element => {
        if (element.closest("nav, header, [role='navigation']")) {
            return "nav";
        }
        if (element.closest("footer, [role='contentinfo']")) {
            return "footer";
        }
        return "body";
    };

    const links = [];
    const seenHrefs = new Set();
    for (const anchor of document.querySelectorAll("a[href]")) {
        const href = anchor.getAttribute("href");
        if (!href || seenHrefs.has(href)) {
            continue;
        }
        seenHrefs.add(href);
        links.push({ href, source: linkSource(anchor) });
    }

    const candidates = [];
    for (const element of document.body ? document.body.querySelectorAll("*") : []) {
        const style = window.getComputedStyle(element);

        // Invisible elements contribute nothing a visitor can see.
        if (style.visibility === "hidden" || style.display === "none" || style.opacity === "0") {
            continue;
        }

        const rect = element.getBoundingClientRect();
        const area = Math.max(0, rect.width) * Math.max(0, rect.height);
        if (area <= 0) {
            continue;
        }

        const text = directText(element);
        const interactive = INTERACTIVE.has(element.tagName) || element.getAttribute("role") === "button";

        // Text directly inside, or interactive: everything else is a layout wrapper.
        if (text.length === 0 && !interactive) {
            continue;
        }

        candidates.push({
            tag: element.tagName.toLowerCase(),
            area,
            glyphs: text.length,
            interactive,
            backgroundColor: style.backgroundColor,
            borderColor: style.borderTopColor,
            borderWidth: style.borderTopWidth,
            borderRadius: style.borderTopLeftRadius,
            boxShadow: style.boxShadow,
            color: style.color,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
            paddingTop: style.paddingTop,
            paddingLeft: style.paddingLeft,
            marginTop: style.marginTop,
            gap: style.gap
        });
    }

    const candidateCount = candidates.length;

    // Above the cap, keep the elements covering the most of the page. Truncating in document order
    // would bias towards the header and drop the hero and the footer entirely.
    const elements = candidateCount > MAX
        ? candidates.sort((a, b) => b.area - a.area).slice(0, MAX)
        : candidates;

    return { elements, candidateCount, links };
})()`;
};
