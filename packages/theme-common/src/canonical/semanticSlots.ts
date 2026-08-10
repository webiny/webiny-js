import type { TokenPath, TokenType } from "~/dtcg/types.js";

/**
 * A core-owned semantic slot for a non-colour type — radius, shadow, spacing or border width.
 *
 * These are the layer the change brief (C2/C3) adds. Colour and typography already work this way: a
 * fixed set of named, intent-carrying slots that *alias a ramp step* rather than holding a raw value.
 * The point is to give "which radius should a button have" an answer — components and generated code
 * bind to `radius.control`, never to `radius.md`. The ramps keep holding the values; these point at
 * them.
 */
export interface CanonicalSemanticSlot {
    path: TokenPath;
    /** Editor grouping key and CSS-variable prefix: `radius`, `shadow`, `space`, `border`. */
    group: string;
    /** Heading shown above the group in the editor. */
    groupLabel: string;
    /** Row label within the group. */
    label: string;
    /** Usage guidance, seeded onto `$description` and read by the generation model. See C5. */
    description: string;
    /** DTCG type, matching the ramp it points at. */
    type: TokenType;
    /** The ramp step this slot aliases in a freshly seeded theme. */
    defaultAlias: TokenPath;
}

const group = (
    groupKey: string,
    groupLabel: string,
    type: TokenType,
    entries: Array<[name: string, label: string, description: string, defaultAlias: TokenPath]>
): CanonicalSemanticSlot[] => {
    return entries.map(([name, label, description, defaultAlias]) => ({
        path: `${groupKey}.${name}`,
        group: groupKey,
        groupLabel,
        label,
        description,
        type,
        defaultAlias
    }));
};

/**
 * The 16 non-colour semantic slots: radius 4, shadow 4, spacing 5, border width 3.
 *
 * Default aliases pick a sensible ramp step; every one becomes a normal, editable reference once
 * seeded. Border widths are `dimension`, not a new token type (see C3).
 */
export const CANONICAL_SEMANTIC_SLOTS: readonly CanonicalSemanticSlot[] = [
    ...group("radius", "Radius", "dimension", [
        [
            "control",
            "Control",
            "Buttons, inputs, selects and other interactive controls",
            "radius.md"
        ],
        ["container", "Container", "Cards, panels and larger surfaces", "radius.lg"],
        ["overlay", "Overlay", "Dropdowns, popovers, menus and tooltips", "radius.lg"],
        ["pill", "Pill", "Fully rounded elements like tags, chips and avatars", "radius.full"]
    ]),
    ...group("shadow", "Shadow", "shadow", [
        ["raised", "Raised", "Cards and panels lifted just above the page", "shadow.sm"],
        ["overlay", "Overlay", "Dropdowns, popovers and tooltips", "shadow.lg"],
        ["modal", "Modal", "Modals and dialogs sitting above a scrim", "shadow.xl"],
        ["sticky", "Sticky", "Headers and bars that stay put while the page scrolls", "shadow.md"]
    ]),
    ...group("space", "Spacing", "dimension", [
        [
            "control.padding-x",
            "Control padding (X)",
            "Horizontal padding inside buttons, inputs and other controls",
            "space.sm"
        ],
        [
            "control.padding-y",
            "Control padding (Y)",
            "Vertical padding inside buttons, inputs and other controls",
            "space.xs"
        ],
        [
            "container.padding",
            "Container padding",
            "Padding inside cards, panels and containers",
            "space.lg"
        ],
        ["gap", "Gap", "The gap between items in a stack or group", "space.md"],
        ["section", "Section", "Vertical gaps between major page sections", "space.3xl"]
    ]),
    ...group("border", "Border width", "dimension", [
        [
            "control",
            "Control",
            "Border width for inputs, buttons and other controls",
            "border.hairline"
        ],
        ["focus-ring", "Focus ring", "Width of the keyboard focus ring", "border.default"],
        [
            "focus-offset",
            "Focus offset",
            "Gap between an element and its focus ring",
            "border.default"
        ]
    ])
];

export const CANONICAL_SEMANTIC_SLOT_PATHS: readonly TokenPath[] = CANONICAL_SEMANTIC_SLOTS.map(
    slot => slot.path
);
