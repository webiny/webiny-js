import type { ThemeManifest } from "@webiny/theme-common";
import type { CapturedNode, SpacingEntry, SpacingKind } from "~/domain/artifacts.js";

/**
 * The spacing a section actually used, by the job each value does, in the theme's vocabulary.
 *
 * Capture records `paddingTop`, `paddingLeft`, `marginTop` and `gap` on every element, and nothing
 * after Capture read them — the shape colour and type had before they were wired through. Generate was
 * left to space components from the shared prompt's examples, which use the library's spacing scale
 * (`--wby-space-md`, 1rem on every theme) rather than the site's, measured into the theme's five
 * semantic slots by theme extraction. So each kind of spacing here is mapped to the slot made for that
 * job, and given as that slot's variable where its value is the section's, as px where it is not.
 */

/** The semantic slot for each kind of spacing. */
const SLOT: Record<SpacingKind, string> = {
    gap: "space.gap",
    container: "space.container.padding",
    section: "space.section",
    "control-y": "space.control.padding-y",
    "control-x": "space.control.padding-x"
};

/** A value counts as the slot's when it is within this of it: a page rounds 19.5px and 20px alike. */
const NEAR = (px: number): number => Math.max(2, px * 0.15);

/** Below this a padding or margin is a border-ish nudge, not spacing worth naming. */
const MIN_PX = 4;

const CONTROL_TAGS = new Set(["a", "button", "input", "select", "textarea", "label"]);

const toPx = (value: unknown): number | null => {
    if (typeof value !== "string") {
        return null;
    }
    const match = /^(-?[\d.]+)(px|rem|em)?$/.exec(value.trim().split(/\s+/)[0]);
    if (!match) {
        return null;
    }
    const n = parseFloat(match[1]);
    if (!isFinite(n) || n <= 0) {
        return null;
    }
    return match[2] === "rem" || match[2] === "em" ? n * 16 : n;
};

const slotPx = (manifest: ThemeManifest | null, path: string) => {
    const slot = manifest?.slots.find(candidate => String(candidate.path) === path);
    const value = slot?.values?.light;
    const px = toPx(typeof value === "string" ? value : null);
    const cssVariable = slot?.cssVariables?.[0];
    return px !== null && cssVariable ? { path, cssVariable, px } : null;
};

export const sectionSpacing = (
    node: CapturedNode,
    manifest: ThemeManifest | null
): SpacingEntry[] => {
    const sectionWidth = node.box?.width ?? 0;
    const counts = new Map<SpacingKind, Map<number, number>>();
    const add = (kind: SpacingKind, px: number | null) => {
        if (px === null || px < MIN_PX) {
            return;
        }
        const rounded = Math.round(px);
        const byValue = counts.get(kind) ?? new Map<number, number>();
        byValue.set(rounded, (byValue.get(rounded) ?? 0) + 1);
        counts.set(kind, byValue);
    };

    const walk = (current: CapturedNode, siblingIndex: number): void => {
        const styles = current.styles ?? {};
        const control = CONTROL_TAGS.has(current.tag);
        // Full width: the section itself or a wrapper as wide as it, whose padding is the section's.
        const fullWidth = sectionWidth > 0 && (current.box?.width ?? 0) >= sectionWidth * 0.95;
        if (/flex|grid/.test(styles.display ?? "")) {
            add("gap", toPx(styles.gap));
        }
        if (siblingIndex > 0) {
            add("gap", toPx(styles.marginTop));
        }
        if (control) {
            add("control-y", toPx(styles.paddingTop));
            add("control-x", toPx(styles.paddingLeft));
        } else if (fullWidth) {
            add("section", toPx(styles.paddingTop));
        } else {
            add("container", toPx(styles.paddingTop));
            add("container", toPx(styles.paddingLeft));
        }
        (current.children ?? []).forEach((child, index) => walk(child, index));
    };
    walk(node, 0);

    const order: SpacingKind[] = ["section", "container", "gap", "control-y", "control-x"];
    return order.flatMap(kind => {
        const byValue = counts.get(kind);
        if (!byValue || byValue.size === 0) {
            return [];
        }
        // The most common value; on a tie, the larger one, which is the more visible.
        const [px, elements] = [...byValue.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
        const slot = slotPx(manifest, SLOT[kind]);
        const matches = slot !== null && Math.abs(slot.px - px) <= NEAR(px);
        return [
            {
                kind,
                px,
                elements,
                token: matches ? slot : null,
                ...(slot && !matches
                    ? { otherSlot: { cssVariable: slot.cssVariable, px: slot.px } }
                    : {})
            }
        ];
    });
};
