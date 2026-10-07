import type { CapturedNode, SectionIcon } from "~/domain/artifacts.js";

/**
 * The icon-font icons a section shows, by what they are for, with the link each sits in.
 *
 * An icon font draws a glyph from the page's own font, so the glyph is meaningless anywhere else and
 * there is no URL to carry across. What survives is the name — "Visit Facebook page" — which is all
 * Generate needs to draw an equivalent inline SVG. Without it a footer's social row became empty
 * 50x50 boxes on every site that draws its icons this way.
 */

/** Bounded so a long icon list (an amenities grid) cannot fill the prompt. */
const MAX_ICONS = 16;

export const sectionIcons = (node: CapturedNode): SectionIcon[] => {
    const icons: SectionIcon[] = [];
    const seen = new Set<string>();

    const walk = (current: CapturedNode, href: string | undefined): void => {
        if (current.styles?.position === "fixed") {
            return;
        }
        const destination = current.href ?? href;
        if (current.icon) {
            const key = `${current.icon.label}|${destination ?? ""}`;
            if (!seen.has(key)) {
                seen.add(key);
                icons.push({
                    label: current.icon.label,
                    ...(destination ? { href: destination } : {})
                });
            }
        }
        for (const child of current.children ?? []) {
            walk(child, destination);
        }
    };
    walk(node, undefined);

    return icons.slice(0, MAX_ICONS);
};
