import type { TokenPath } from "~/dtcg/types.js";

/**
 * A core-owned colour slot. Slot paths never change, so the emitted CSS variable name derives
 * directly from the path and renaming is never a data migration.
 */
export interface CanonicalColorSlot {
    path: TokenPath;
    /** Editor grouping key, e.g. `surface`, `action.primary`. */
    group: string;
    /** Heading shown above the group in the editor. */
    groupLabel: string;
    /** Row label within the group. */
    label: string;
}

const slots = (
    group: string,
    groupLabel: string,
    entries: Array<[name: string, label: string]>
): CanonicalColorSlot[] => {
    return entries.map(([name, label]) => ({
        path: `color.${group}.${name}`,
        group,
        groupLabel,
        label
    }));
};

/**
 * The 29 canonical colour slots. Fixed in name and count, present in every theme. These are the
 * only colour tokens that Admin UI, Lexical and the Tailwind adapter bind to.
 */
export const CANONICAL_COLOR_SLOTS: readonly CanonicalColorSlot[] = [
    ...slots("surface", "Surface", [
        ["page", "Page"],
        ["raised", "Raised"],
        ["sunken", "Sunken"],
        ["overlay", "Overlay"]
    ]),
    ...slots("text", "Text", [
        ["primary", "Primary"],
        ["secondary", "Secondary"],
        ["muted", "Muted"],
        ["inverse", "Inverse"],
        ["link", "Link"]
    ]),
    ...slots("border", "Border", [
        ["default", "Default"],
        ["subtle", "Subtle"],
        ["strong", "Strong"],
        ["focus", "Focus"]
    ]),
    ...slots("action.primary", "Primary action", [
        ["background", "Background"],
        ["foreground", "Foreground"],
        ["hover", "Hover"],
        ["active", "Active"]
    ]),
    ...slots("action.secondary", "Secondary action", [
        ["background", "Background"],
        ["foreground", "Foreground"],
        ["hover", "Hover"],
        ["active", "Active"]
    ]),
    ...slots("feedback.info", "Info", [
        ["background", "Background"],
        ["foreground", "Foreground"]
    ]),
    ...slots("feedback.success", "Success", [
        ["background", "Background"],
        ["foreground", "Foreground"]
    ]),
    ...slots("feedback.warning", "Warning", [
        ["background", "Background"],
        ["foreground", "Foreground"]
    ]),
    ...slots("feedback.danger", "Danger", [
        ["background", "Background"],
        ["foreground", "Foreground"]
    ])
];

export const CANONICAL_COLOR_SLOT_PATHS: readonly TokenPath[] = CANONICAL_COLOR_SLOTS.map(
    slot => slot.path
);
