import type { CapturedNode } from "@webiny/api-component-extraction/domain/artifacts.js";

const normalise = (text: string): string => text.replace(/\s+/g, " ").trim();

/**
 * Every non-empty text run in a section's subtree, in document order.
 *
 * This is the per-instance material Assemble does not carry: it holds one cluster-wide sample per
 * prop, so the only way to tell one page's hero copy from another's is to walk that page's own
 * captured tree. Order is what makes the walk useful — `deriveInstanceProps` aligns positionally.
 */
export const collectSectionTexts = (node: CapturedNode): string[] => {
    const texts: string[] = [];

    const walk = (current: CapturedNode): void => {
        const text = current.text ? normalise(current.text) : "";
        if (text) {
            texts.push(text);
        }
        for (const child of current.children) {
            walk(child);
        }
    };

    walk(node);
    return texts;
};
