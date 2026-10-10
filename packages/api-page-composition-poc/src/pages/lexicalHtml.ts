import type { CapturedNode } from "@webiny/api-component-extraction/domain/artifacts.js";
import {
    findInlineLinks,
    holdsParagraph,
    paragraphOwnText,
    paragraphWithLink,
    type InlineLink
} from "@webiny/api-component-extraction/features/stages/plan/inlineLinks.js";

/**
 * Rich text inputs a component renders as HTML, read from its source.
 *
 * A rich text value is an HTML string by the input's contract, but generated components do not all
 * honour it. Measured with this function across the 206 rich text props in the 33 stored runs'
 * components (2026-10-10): 157 render the value as HTML only and get links; the other 49 print it as
 * text, treat it as an array, or rebuild a link from a placeholder, and keep plain text. (A first count
 * said 175: its word boundary matched inside class names such as `property-description-label`.)
 * Handing HTML to a component that prints it shows the markup on the page, which is worse
 * than a link without its destination — so HTML goes only to an input rendered as HTML and never as
 * text. The source is the authority, as it is for file input shapes.
 */
export const lexicalHtmlInputs = (source: string): Set<string> => {
    const body = source.split("export const manifest")[0];
    const names = new Set<string>();
    for (const match of source.matchAll(/name:\s*"([^"]+)",\s*factory:\s*"createLexicalInput"/g)) {
        const name = match[1];
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        /*
         * The identifier on its own: not part of a class name (`property-description-label`), a member
         * (`x.description`) or a longer name. A word boundary alone matched inside the class name and
         * counted an HTML-rendering component as printing its text.
         */
        const id = `(?<![\\w.-])${escaped}(?![\\w-])`;
        const asHtml = new RegExp(`__html:\\s*[^}]*${id}`).test(body);
        const asText =
            new RegExp(`\\{\\s*${id}\\s*\\}`).test(body) ||
            new RegExp(`>\\s*\\{[^}]*${id}[^}]*\\}\\s*<`).test(body);
        if (asHtml && !asText) {
            names.add(name);
        }
    }
    return names;
};

const escapeHtml = (text: string): string =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const anchor = (label: string, href: string): string =>
    `<a href="${escapeHtml(href).replace(/"/g, "&quot;")}">${escapeHtml(label)}</a>`;

const normalise = (text: string): string => text.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * A derived rich text value with the section's inline links put back.
 *
 * Composition derives rich text from the section's text runs, as plain text, so an inline link reached
 * the page as words without a destination — and, while Plan lifted it, a second time as a standalone
 * link. Two cases:
 *
 * - **The value holds the link's text:** wrap it, at its first occurrence, in the link.
 * - **The value is the paragraph with the link's text missing** (the sentence was split around the
 *   link): use the paragraph rebuilt from its own runs with the link in place.
 *
 * A value already holding a link, or with nothing to link, is returned unchanged.
 */
export const withInlineLinks = (
    value: string,
    section: CapturedNode,
    /**
     * Link labels the component already carries as inputs of its own (a `privacyLink` it renders after
     * the text). A sentence the component assembles itself is not rebuilt: Take 3's Contact Form
     * appended its own privacy link after the rebuilt sentence's, and showed it twice.
     */
    ownLabels: ReadonlySet<string> = new Set()
): string => {
    if (/<a\s[^>]*href=/i.test(value)) {
        return value;
    }
    const links = findInlineLinks(section);
    if (links.length === 0) {
        return value;
    }

    // Wrap every link whose text is in the value, left to right, over the plain text.
    const placed: { at: number; link: InlineLink }[] = [];
    const lower = value.toLowerCase();
    for (const link of links) {
        /*
         * Only in the value that holds the link's paragraph, as Plan's fold does. Wrapping wherever the
         * words appeared linked Take 3's heading "Explore our ideal location in Bridgeport.", which has
         * no link on the source. A value that is the link's words alone does not hold the paragraph
         * either, and stays as it is: that is a wrong-slot value, and linking it would hide it.
         */
        if (!holdsParagraph(value, link.paragraph)) {
            continue;
        }
        const at = lower.indexOf(link.label.toLowerCase());
        const overlaps = placed.some(
            other => at < other.at + other.link.label.length && other.at < at + link.label.length
        );
        if (at >= 0 && !overlaps) {
            placed.push({ at, link });
        }
    }
    if (placed.length > 0) {
        placed.sort((a, b) => a.at - b.at);
        let html = "";
        let cursor = 0;
        for (const { at, link } of placed) {
            html += escapeHtml(value.slice(cursor, at));
            html += anchor(value.slice(at, at + link.label.length), link.href);
            cursor = at + link.label.length;
        }
        return html + escapeHtml(value.slice(cursor));
    }

    // The sentence was split around a link: the value is part of the paragraph, without the link.
    const fragment = normalise(value);
    for (const link of links) {
        if (ownLabels.has(normalise(link.label))) {
            continue;
        }
        /*
         * Only a value that is the paragraph's own words split around the link — never the link's words,
         * which a wrong-slot derivation puts in a body on its own. Rebuilding from those would fill in a
         * lost sentence silently and hide that defect rather than fix it.
         */
        if (
            fragment &&
            fragment !== normalise(link.label) &&
            normalise(paragraphOwnText(link.paragraph)).includes(fragment)
        ) {
            const rebuilt = paragraphWithLink(link.paragraph, link);
            if (rebuilt) {
                return rebuilt;
            }
        }
    }
    return value;
};

/**
 * The link markup the inline-link fold produces. Only anchors: a component may render other markup
 * from a plain input on purpose (an inline `<svg>` icon in a default), and that is left alone.
 */
const ANCHOR_TAGS = /<a\s[^>]*>|<\/a>/gi;
const HAS_ANCHOR = /<a\s[^>]*>|<\/a>/i;

const decodeEntities = (text: string): string =>
    text
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");

/**
 * A value made safe for an input that does not render HTML: link tags removed, entities decoded.
 *
 * Composition can write a rich text value into any input — its scalar derivation falls back to Plan's
 * stored sample — and Plan's rich text samples now carry their inline links as HTML. On Take 3 that put
 * `<a href="…">privacy policy</a>` into Contact Us Form's plain-text `privacyText`, which printed the
 * markup on the page. The route existed before the fold; nothing produced HTML to send down it.
 */
export const asPlainText = (value: string, ownLabels: ReadonlySet<string> = new Set()): string => {
    if (!HAS_ANCHOR.test(value)) {
        return value;
    }
    /*
     * A link the component renders itself as an input of its own goes with its words, as a sentence the
     * component assembles is not rebuilt (`withInlineLinks`). Keeping the words put "…agree to the
     * privacy policy. privacy policy." on Take 3's amenities page: the stripped sentence, then the
     * component's own link.
     */
    const withoutOwn = value.replace(/<a\s[^>]*>([\s\S]*?)<\/a>/gi, (_whole, label: string) =>
        ownLabels.has(normalise(decodeEntities(label))) ? "" : label
    );
    return decodeEntities(withoutOwn.replace(ANCHOR_TAGS, ""))
        .replace(/\s+/g, " ")
        .replace(/\s+([.,;:!?])/g, "$1")
        .trim();
};

/** Every string under an input value made plain, through nested objects and lists. */
export const plainTextDeep = (
    value: unknown,
    ownLabels: ReadonlySet<string> = new Set()
): unknown => {
    if (typeof value === "string") {
        return asPlainText(value, ownLabels);
    }
    if (Array.isArray(value)) {
        return value.map(inner => plainTextDeep(inner, ownLabels));
    }
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, inner]) => [key, plainTextDeep(inner, ownLabels)])
        );
    }
    return value;
};

/** Every string label in an input value, normalised: what the component already carries itself. */
export const labelsIn = (value: unknown, into: Set<string> = new Set()): Set<string> => {
    if (typeof value === "string") {
        into.add(normalise(value));
    } else if (Array.isArray(value)) {
        value.forEach(inner => labelsIn(inner, into));
    } else if (value && typeof value === "object") {
        Object.values(value).forEach(inner => labelsIn(inner, into));
    }
    return into;
};
