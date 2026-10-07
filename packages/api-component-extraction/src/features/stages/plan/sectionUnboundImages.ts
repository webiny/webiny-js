import type {
    CapturedNode,
    ComponentProp,
    ObservedStructuredValue,
    SectionImage
} from "~/domain/artifacts.js";

/**
 * The images a section shows that no prop carries.
 *
 * Plan's contract is a proposal, and it leaves images out: a footer's management-company logo, its
 * fair-housing and accessibility badges, a sponsor mark. Nothing downstream ever sees them — Generate
 * is handed the props' values and told not to invent a URL, so it cannot put the logo back even when
 * the crop shows it. Measured on the baseline, every G5 footer and thevibe's lost their logos this way,
 * with every check green.
 *
 * So the page's own images that the props did not take are named for Generate, with their URLs.
 */

/** Smaller than this is a glyph, a bullet, a spacer — not content anyone would miss. */
const MIN_EDGE = 16;
/** Bounded so a gallery section cannot fill the prompt. */
const MAX_IMAGES = 12;

const boundUrls = (props: ComponentProp[]): Set<string> => {
    const urls = new Set<string>();
    const fromValue = (value: ObservedStructuredValue): void => {
        if (value.kind === "media") {
            urls.add(value.src);
        } else if (value.kind === "item") {
            for (const field of Object.values(value.fields)) {
                if (typeof field === "object" && field && "src" in field) {
                    urls.add(field.src);
                }
            }
        }
    };
    const walk = (prop: ComponentProp): void => {
        (prop.observedStructured ?? []).forEach(fromValue);
        (prop.fields ?? []).forEach(walk);
    };
    props.forEach(walk);
    return urls;
};

export const sectionUnboundImages = (node: CapturedNode, props: ComponentProp[]): SectionImage[] => {
    const bound = boundUrls(props);
    const found = new Map<string, SectionImage>();

    const walk = (current: CapturedNode): void => {
        // A fixed element is chrome that follows the viewport, not this section's content.
        if (current.styles?.position === "fixed") {
            return;
        }
        const box = current.box;
        if (
            current.tag === "img" &&
            current.src &&
            /^https?:/.test(current.src) &&
            box &&
            box.width >= MIN_EDGE &&
            box.height >= MIN_EDGE &&
            !bound.has(current.src) &&
            !found.has(current.src)
        ) {
            found.set(current.src, {
                url: current.src,
                ...(current.alt ? { alt: current.alt } : {}),
                width: Math.round(box.width),
                height: Math.round(box.height)
            });
        }
        for (const child of current.children ?? []) {
            walk(child);
        }
    };
    walk(node);

    return [...found.values()].slice(0, MAX_IMAGES);
};
