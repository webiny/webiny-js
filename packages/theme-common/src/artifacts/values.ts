import { isShadowValue, isTypographyValue, TYPOGRAPHY_SUB_PROPERTIES } from "~/dtcg/guards.js";
import type { ShadowLayerValue, TokenValue } from "~/dtcg/types.js";
import { toTypographyCssVariableName } from "~/naming/cssVariable.js";
import type { SnapshotToken } from "~/snapshot.js";

/**
 * Turning resolved token values into CSS.
 *
 * Everything here operates on a frozen snapshot, so values are already literals — there is no alias
 * resolution left to do and no way for output to drift from what was published.
 */

const quoteFontFamily = (family: string): string => {
    // Multi-word families need quoting; a comma means the author already supplied a stack.
    if (family.includes(",") || family.startsWith('"') || family.startsWith("'")) {
        return family;
    }
    return /\s/.test(family) ? `"${family}"` : family;
};

export const formatFontFamily = (value: string | string[]): string => {
    const families = Array.isArray(value) ? value : [value];
    return families.map(quoteFontFamily).join(", ");
};

const formatShadowLayer = (layer: ShadowLayerValue): string => {
    const parts = [layer.offsetX, layer.offsetY, layer.blur, layer.spread, layer.color];
    return layer.inset ? `inset ${parts.join(" ")}` : parts.join(" ");
};

export const formatShadow = (value: ShadowLayerValue | ShadowLayerValue[]): string => {
    const layers = Array.isArray(value) ? value : [value];
    return layers.map(formatShadowLayer).join(", ");
};

/** Serialises any non-composite value to its CSS form. */
export const formatScalar = (value: TokenValue): string => {
    if (typeof value === "number") {
        return String(value);
    }
    if (Array.isArray(value)) {
        return value.join(", ");
    }
    return String(value);
};

export interface CssDeclaration {
    name: string;
    value: string;
}

/**
 * Expands one snapshot token into the declarations it contributes.
 *
 * A composite typography token flattens to one declaration per sub-property, which is why this
 * returns a list rather than a single value — see the design brief, section 4.9.
 */
export const tokenToDeclarations = (
    token: SnapshotToken,
    variableName: string
): CssDeclaration[] => {
    const value = token.value;

    if (token.type === "typography" || isTypographyValue(value)) {
        if (!isTypographyValue(value)) {
            return [];
        }

        return TYPOGRAPHY_SUB_PROPERTIES.map(subProperty => {
            const raw = value[subProperty];
            return {
                name: toTypographyCssVariableName(token.path, subProperty),
                value:
                    subProperty === "fontFamily"
                        ? formatFontFamily(raw as string | string[])
                        : formatScalar(raw as TokenValue)
            };
        });
    }

    if (token.type === "shadow" || isShadowValue(value)) {
        if (!isShadowValue(value)) {
            return [];
        }
        return [{ name: variableName, value: formatShadow(value) }];
    }

    if (token.type === "fontFamily") {
        return [{ name: variableName, value: formatFontFamily(value as string | string[]) }];
    }

    return [{ name: variableName, value: formatScalar(value) }];
};
