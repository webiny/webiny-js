import type { CapturedNode } from "@webiny/api-component-extraction/domain/artifacts.js";
import {
    findInlineLinks,
    paragraphText,
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
export const withInlineLinks = (value: string, section: CapturedNode): string => {
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
        if (fragment && normalise(paragraphText(link.paragraph)).includes(fragment)) {
            const rebuilt = paragraphWithLink(link.paragraph, link);
            if (rebuilt) {
                return rebuilt;
            }
        }
    }
    return value;
};
