import type {
    AliasValue,
    DesignToken,
    ShadowLayerValue,
    TokenGroup,
    TokenNode,
    TokenPath,
    TypographyValue
} from "./types.js";

/** Matches a DTCG alias occupying the entire string, e.g. `{color.brand.signal600}`. */
const ALIAS_PATTERN = /^\{([^{}]+)\}$/;

/** `$`-prefixed keys are DTCG metadata, never child token names. */
export const isReservedKey = (key: string): boolean => key.startsWith("$");

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const isDesignToken = (node: unknown): node is DesignToken => {
    return isPlainObject(node) && "$value" in node;
};

export const isTokenGroup = (node: unknown): node is TokenGroup => {
    return isPlainObject(node) && !("$value" in node);
};

/**
 * True when the value is a complete alias. Partial interpolation (`1px solid {color.border}`) is
 * not valid DTCG and is deliberately not recognised.
 */
export const isAlias = (value: unknown): value is AliasValue => {
    return typeof value === "string" && ALIAS_PATTERN.test(value);
};

/** Extracts the target path from an alias, or `null` when the value is not an alias. */
export const parseAlias = (value: unknown): TokenPath | null => {
    if (typeof value !== "string") {
        return null;
    }

    const match = ALIAS_PATTERN.exec(value);
    if (!match) {
        return null;
    }

    const path = match[1].trim();
    return path.length > 0 ? path : null;
};

export const toAlias = (path: TokenPath): AliasValue => `{${path}}`;

/** Sub-properties of a composite typography value, in emission order. */
export const TYPOGRAPHY_SUB_PROPERTIES = [
    "fontFamily",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "letterSpacing"
] as const satisfies readonly (keyof TypographyValue)[];

export type TypographySubProperty = (typeof TYPOGRAPHY_SUB_PROPERTIES)[number];

export const isTypographyValue = (value: unknown): value is TypographyValue => {
    if (!isPlainObject(value)) {
        return false;
    }
    return TYPOGRAPHY_SUB_PROPERTIES.every(key => key in value);
};

export const isShadowLayer = (value: unknown): value is ShadowLayerValue => {
    if (!isPlainObject(value)) {
        return false;
    }
    return ["color", "offsetX", "offsetY", "blur", "spread"].every(key => key in value);
};

export const isShadowValue = (value: unknown): value is ShadowLayerValue | ShadowLayerValue[] => {
    if (Array.isArray(value)) {
        return value.length > 0 && value.every(isShadowLayer);
    }
    return isShadowLayer(value);
};

/** Returns the child token/group names of a group, excluding `$`-prefixed metadata. */
export const childNames = (group: TokenGroup): string[] => {
    return Object.keys(group).filter(key => !isReservedKey(key));
};

/** Returns a group's children as `[name, node]` pairs, excluding `$`-prefixed metadata. */
export const children = (group: TokenGroup): Array<[string, TokenNode]> => {
    return childNames(group).map(name => [name, group[name] as TokenNode]);
};
