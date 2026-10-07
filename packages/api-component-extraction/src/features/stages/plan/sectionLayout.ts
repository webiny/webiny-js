import type {
    CapturedNode,
    LayoutElement,
    SectionImageFact,
    SectionLayout
} from "~/domain/artifacts.js";

/**
 * Where a section's elements sit, and how big they are.
 *
 * Generate is given the crop and asked to reproduce it, with no measurements: it guesses sizes from a
 * picture the model sees downscaled. Freehill's header logo is 340x108 on the page and was generated at
 * a third of that; 13 of the baseline's 66 rendered components came out outside 0.67-1.5x of their
 * section's height. The captured tree has every element's box, so the section's own geometry is
 * passed on: its size, and each element relative to its top-left.
 */

/** Enough for a header, a hero or a card grid; a long text section is summarised by its largest. */
const MAX_ELEMENTS = 40;
/** Images, backgrounds and icons are kept before text when the cap bites: they are what goes missing. */
const MAX_VISUALS = 15;
/** Smaller than this is a rule, a dot, a spacer. */
const MIN_EDGE = 6;
const LABEL_CAP = 48;

const fileName = (url: string): string => {
    try {
        return decodeURIComponent(new URL(url).pathname.split("/").pop() ?? url);
    } catch {
        return url.split("/").pop() ?? url;
    }
};

const quote = (text: string): string => {
    const flat = text.replace(/\s+/g, " ").trim();
    return `"${flat.length > LABEL_CAP ? `${flat.slice(0, LABEL_CAP - 1)}…` : flat}"`;
};

const FIELD_TAGS = new Set(["input", "select", "textarea"]);

export const sectionLayout = (node: CapturedNode): SectionLayout => {
    const origin = node.box;
    const found: (LayoutElement & { area: number })[] = [];

    const place = (kind: LayoutElement["kind"], label: string, current: CapturedNode): void => {
        const box = current.box;
        if (!box || box.width < MIN_EDGE || box.height < MIN_EDGE) {
            return;
        }
        // Wholly outside the section is not on screen: an off-canvas spam-trap field, the caption
        // of a carousel slide parked to the left. Partly inside — a slide peeking in — is.
        if (
            box.x + box.width <= origin.x ||
            box.x >= origin.x + origin.width ||
            box.y + box.height <= origin.y ||
            box.y >= origin.y + origin.height
        ) {
            return;
        }
        found.push({
            kind,
            label,
            x: Math.round(box.x - origin.x),
            y: Math.round(box.y - origin.y),
            width: Math.round(box.width),
            height: Math.round(box.height),
            area: box.width * box.height
        });
    };

    const walk = (current: CapturedNode, isRoot: boolean): void => {
        // Chrome that follows the viewport is not part of the section's layout.
        if (!isRoot && current.styles?.position === "fixed") {
            return;
        }
        // An inline data: graphic (a CSS-drawn icon) has no file to name and nothing to carry over.
        if (current.background?.url && /^https?:/.test(current.background.url)) {
            place("background", fileName(current.background.url), current);
        }
        if ((current.tag === "img" || current.tag === "video") && current.src) {
            place("image", current.alt ? quote(current.alt) : fileName(current.src), current);
        } else if (current.icon) {
            place("icon", current.icon.label, current);
        } else if (FIELD_TAGS.has(current.tag)) {
            place("field", current.tag, current);
        }
        const text = (current.textRuns ?? (current.text ? [current.text] : [])).join(" ").trim();
        if (text) {
            place("text", quote(text), current);
        }
        for (const child of current.children ?? []) {
            walk(child, false);
        }
    };
    walk(node, true);

    // Pictures stacked in one place are a carousel's slides: one entry, counted.
    const stacked = new Map<string, LayoutElement & { area: number; count: number }>();
    for (const element of found.filter(
        item => item.kind === "image" || item.kind === "background"
    )) {
        const key = `${element.kind}|${element.x},${element.y},${element.width},${element.height}`;
        const existing = stacked.get(key);
        if (existing) {
            existing.count++;
        } else {
            stacked.set(key, { ...element, count: 1 });
        }
    }
    const pictures = [...stacked.values()].map(({ count, ...element }) =>
        count > 1
            ? {
                  ...element,
                  label: `${count} stacked in one place (a carousel; one shows at a time), first ${element.label}`
              }
            : element
    );
    const others = found.filter(item => item.kind !== "image" && item.kind !== "background");

    const visuals = [...pictures, ...others]
        .filter(element => element.kind !== "text")
        .sort((a, b) => b.area - a.area)
        .slice(0, MAX_VISUALS);
    const texts = others
        .filter(element => element.kind === "text")
        .sort((a, b) => b.area - a.area)
        .slice(0, MAX_ELEMENTS - visuals.length);
    const kept = [...visuals, ...texts].sort((a, b) => a.y - b.y || a.x - b.x);

    return {
        width: Math.round(origin.width),
        height: Math.round(origin.height),
        elements: kept.map(({ area: _area, ...element }) => element),
        omitted: pictures.length + others.length - kept.length
    };
};

/**
 * The section's pictures, by the part each plays, with the size it is drawn at.
 *
 * A picture can be the section's backdrop or an element in it, and the crop does not say which: a
 * full-bleed photograph and a large inline one look alike, and a header logo looks like decoration. So
 * each is named with its role and its drawn size, largest first. Tone is filled in by Plan from the
 * file itself (`imageTone`), which this does not fetch.
 */
export const sectionImages = (
    node: CapturedNode
): Omit<SectionImageFact, "tone" | "transparent">[] => {
    const origin = node.box;
    const sectionArea = Math.max(1, origin.width * origin.height);
    const byUrl = new Map<string, Omit<SectionImageFact, "tone" | "transparent">>();

    const add = (url: string, current: CapturedNode, background: boolean): void => {
        const box = current.box;
        if (!box || box.width < MIN_EDGE || box.height < MIN_EDGE || !/^https?:/.test(url)) {
            return;
        }
        const coverage = Math.min(1, (box.width * box.height) / sectionArea);
        const role: SectionImageFact["role"] = background
            ? "background"
            : coverage >= FILLS_SECTION
              ? "fills-section"
              : "inline";
        const existing = byUrl.get(url);
        if (existing && existing.width * existing.height >= box.width * box.height) {
            return;
        }
        byUrl.set(url, {
            url,
            role,
            width: Math.round(box.width),
            height: Math.round(box.height),
            coverage: Math.round(coverage * 100) / 100,
            ...(current.alt ? { alt: current.alt } : {})
        });
    };

    const walk = (current: CapturedNode, isRoot: boolean): void => {
        if (!isRoot && current.styles?.position === "fixed") {
            return;
        }
        if (current.background?.url) {
            add(current.background.url, current, true);
        }
        if ((current.tag === "img" || current.tag === "video") && current.src) {
            add(current.src, current, false);
        }
        for (const child of current.children ?? []) {
            walk(child, false);
        }
    };
    walk(node, true);

    return [...byUrl.values()]
        .sort((a, b) => b.width * b.height - a.width * a.height)
        .slice(0, MAX_VISUALS);
};

/** An inline picture over this share of the section is laid out as its backdrop, whatever its tag. */
const FILLS_SECTION = 0.6;
