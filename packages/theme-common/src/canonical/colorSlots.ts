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
    /**
     * Usage guidance, written for the component-generation model as much as for a person: it says
     * *when to reach for the slot*, not what colour it is. Seeded onto the token's `$description` and
     * editable afterwards. See the change brief, C5.
     */
    description: string;
}

const slots = (
    group: string,
    groupLabel: string,
    entries: Array<[name: string, label: string, description: string]>
): CanonicalColorSlot[] => {
    return entries.map(([name, label, description]) => ({
        path: `color.${group}.${name}`,
        group,
        groupLabel,
        label,
        description
    }));
};

/**
 * The 40 canonical colour slots. Fixed in name and count, present in every theme. These are the
 * only colour tokens that Admin UI, Lexical and the Tailwind adapter bind to.
 *
 * Ghost and destructive action variants exist because a generated delete button or a subtle
 * secondary action has nowhere else to bind; disabled exists because every generated control needs
 * one and a model will otherwise invent an opacity value; scrim is the dim behind a modal, distinct
 * from `surface.overlay`, which is the popover surface itself.
 */
export const CANONICAL_COLOR_SLOTS: readonly CanonicalColorSlot[] = [
    ...slots("surface", "Surface", [
        ["page", "Page", "The page background, sitting behind all other content"],
        ["raised", "Raised", "Cards, panels and anything sitting above the page"],
        ["sunken", "Sunken", "Wells and insets that recede below the page, such as a code block"],
        ["overlay", "Overlay", "The surface of popovers, dropdowns, menus and tooltips"],
        ["scrim", "Scrim", "The dim backdrop behind a modal or drawer"]
    ]),
    ...slots("text", "Text", [
        ["primary", "Primary", "Body copy and headings — the default text colour"],
        ["secondary", "Secondary", "Supporting text a step below body in emphasis"],
        ["muted", "Muted", "De-emphasised text: hints, placeholders and timestamps"],
        [
            "inverse",
            "Inverse",
            "Text for the theme's inverse surface; flips with the mode (light in light mode, dark in dark), so use it only over a theme surface, not a fixed background"
        ],
        ["link", "Link", "Hyperlinks and other inline navigational text"]
    ]),
    ...slots("border", "Border", [
        ["default", "Default", "The default border for cards, inputs and dividers"],
        ["subtle", "Subtle", "A faint divider where a full border would be too heavy"],
        ["strong", "Strong", "A prominent border for emphasis or a selected state"],
        ["focus", "Focus", "The colour of the keyboard focus ring on interactive elements"]
    ]),
    ...slots("action.primary", "Primary action", [
        ["background", "Background", "Buttons, links and other primary actions"],
        ["foreground", "Foreground", "Text and icons sitting on a primary action"],
        ["hover", "Hover", "A primary action's background while hovered"],
        ["active", "Active", "A primary action's background while pressed"]
    ]),
    ...slots("action.secondary", "Secondary action", [
        ["background", "Background", "Secondary, lower-emphasis buttons"],
        ["foreground", "Foreground", "Text and icons on a secondary action"],
        ["hover", "Hover", "A secondary action's background while hovered"],
        ["active", "Active", "A secondary action's background while pressed"]
    ]),
    ...slots("action.ghost", "Ghost action", [
        [
            "background",
            "Background",
            "Low-emphasis buttons with no fill until interacted with, such as toolbar and icon buttons"
        ],
        ["foreground", "Foreground", "Text and icons of a ghost button"],
        ["hover", "Hover", "A ghost button's background while hovered"],
        ["active", "Active", "A ghost button's background while pressed"]
    ]),
    ...slots("action.destructive", "Destructive action", [
        ["background", "Background", "Buttons that delete or perform irreversible actions"],
        ["foreground", "Foreground", "Text and icons on a destructive button"],
        ["hover", "Hover", "A destructive button's background while hovered"],
        ["active", "Active", "A destructive button's background while pressed"]
    ]),
    ...slots("action.disabled", "Disabled action", [
        ["background", "Background", "The background of a disabled control"],
        ["foreground", "Foreground", "Text and icons of a disabled control"]
    ]),
    ...slots("feedback.info", "Info", [
        ["background", "Background", "The surface of an informational alert, badge or banner"],
        ["foreground", "Foreground", "Text and icons within an informational alert or badge"]
    ]),
    ...slots("feedback.success", "Success", [
        ["background", "Background", "The surface of a success alert, badge or banner"],
        ["foreground", "Foreground", "Text and icons within a success alert or badge"]
    ]),
    ...slots("feedback.warning", "Warning", [
        ["background", "Background", "The surface of a warning alert, badge or banner"],
        ["foreground", "Foreground", "Text and icons within a warning alert or badge"]
    ]),
    ...slots("feedback.danger", "Danger", [
        ["background", "Background", "The surface of an error or danger alert, badge or banner"],
        ["foreground", "Foreground", "Text and icons within an error or danger alert or badge"]
    ])
];

export const CANONICAL_COLOR_SLOT_PATHS: readonly TokenPath[] = CANONICAL_COLOR_SLOTS.map(
    slot => slot.path
);
