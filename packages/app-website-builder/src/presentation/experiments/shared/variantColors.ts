/**
 * Shared bucket colours for the A/B UI. The control is always neutral; variants cycle a fixed
 * palette by their 0-based index. Used by the experiment form, the list cards, and the in-preview
 * toolbar so a given variant shows the same colour everywhere.
 */
export const CONTROL_COLOR = "#9ca3af";

export const VARIANT_COLORS = ["#e2572a", "#4285f4", "#0f9d58", "#a142f4", "#f4b400"];

/** Colour for a variant by its 0-based index among the experiment's variants. */
export const variantColor = (variantIndex: number): string =>
    VARIANT_COLORS[variantIndex % VARIANT_COLORS.length];

/** Colour for a bucket: neutral for the control, otherwise the variant's palette colour. */
export const bucketColor = (isControl: boolean, variantIndex: number): string =>
    isControl ? CONTROL_COLOR : variantColor(variantIndex);
