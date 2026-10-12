import type { CapturedNode, SectionHeading } from "~/domain/artifacts.js";

const HEADING = /^h([1-6])$/;
const MAX_TEXT = 120;

const clean = (text: string | undefined): string =>
    (text ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);

const innerTexts = (node: CapturedNode): string[] =>
    (node.children ?? []).flatMap(child => {
        const own = clean(child.text);
        return [...(own ? [own] : []), ...innerTexts(child)];
    });

/**
 * The section's headings, in document order, from its captured tree.
 *
 * The level is the source's own markup: what an `h1`–`h6` says, nothing inferred from size. Capture
 * records each element's tag, and until now the only heading fact Generate got was "the largest is
 * the section's heading at N px", which is a guess about size, not a level.
 *
 * Text inside a heading's child elements (an eyebrow `<span>`) is kept apart from the heading's own
 * text, because the tree does not record which comes first on the page. A heading with no text at all
 * (an icon, an empty element) is left out: there is nothing to match it to.
 */
export const sectionHeadings = (section: CapturedNode): SectionHeading[] => {
    const headings: SectionHeading[] = [];
    const walk = (node: CapturedNode) => {
        const match = HEADING.exec(node.tag);
        if (match) {
            const text = clean(node.text);
            const inner = innerTexts(node);
            if (text || inner.length > 0) {
                headings.push({ level: Number(match[1]), text, inner });
            }
            return;
        }
        for (const child of node.children ?? []) {
            walk(child);
        }
    };
    walk(section);
    return headings;
};
