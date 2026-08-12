import type { CapturedNode, SectionDigest } from "~/domain/artifacts.js";

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const IMAGE_TAGS = new Set(["img", "picture"]);
const LINK_TAGS = new Set(["a", "button"]);

const structureSummary = (node: CapturedNode, depth = 2): string => {
    if (depth <= 0 || node.children.length === 0) {
        return node.tag;
    }
    return `${node.tag}>${node.children
        .slice(0, 8)
        .map(child => structureSummary(child, depth - 1))
        .join(",")}`;
};

/** A compact, model-friendly digest of a section subtree — structure, text snippets and element counts. */
export const sectionDigest = (node: CapturedNode, maxTexts = 40): SectionDigest => {
    const texts: string[] = [];
    const seen = new Set<string>();
    let imageCount = 0;
    let linkCount = 0;
    let headingCount = 0;

    const walk = (current: CapturedNode): void => {
        if (IMAGE_TAGS.has(current.tag)) {
            imageCount++;
        }
        if (LINK_TAGS.has(current.tag)) {
            linkCount++;
        }
        if (HEADING_TAGS.has(current.tag)) {
            headingCount++;
        }
        if (current.text && !seen.has(current.text) && texts.length < maxTexts) {
            seen.add(current.text);
            texts.push(current.text);
        }
        current.children.forEach(walk);
    };
    walk(node);

    return { structure: structureSummary(node), texts, imageCount, linkCount, headingCount };
};

/** A human-readable fallback name when the model cannot classify a cluster confidently. */
export const descriptiveName = (digest: SectionDigest): string => {
    if (digest.texts[0]) {
        return digest.texts[0].slice(0, 60);
    }
    if (digest.imageCount > 0 && digest.headingCount === 0) {
        return "Media section";
    }
    return "Section";
};
