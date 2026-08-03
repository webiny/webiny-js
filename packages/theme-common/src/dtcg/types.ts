/**
 * W3C Design Tokens Community Group (DTCG) format.
 *
 * A token document is a tree of plain objects. Keys beginning with `$` are reserved metadata
 * (`$value`, `$type`, `$description`, `$extensions`); every other key is a child token or group.
 *
 * DEVIATION FROM THE SPEC — modes. The DTCG format has no concept of light/dark variants. We carry
 * the second value under `$extensions` in the `com.webiny.modes` namespace, which is the
 * established ecosystem workaround. Only mode-varying types (`color`, `shadow`) may declare one;
 * see {@link MODE_VARYING_TYPES}.
 */

/** `$extensions` namespace holding per-mode value overrides. */
export const MODES_EXTENSION = "com.webiny.modes";

/** `$extensions` namespace holding Webiny editor metadata that is not part of the token value. */
export const META_EXTENSION = "com.webiny.meta";

export type ThemeMode = "light" | "dark";

/**
 * The subset of DTCG `$type`s the Theme app understands. Tokens carrying any other `$type` are
 * preserved verbatim but are not resolved, validated or projected into CSS.
 */
export type TokenType =
    | "color"
    | "dimension"
    | "fontFamily"
    | "fontWeight"
    | "number"
    | "duration"
    | "cubicBezier"
    | "shadow"
    | "typography";

/**
 * Types whose value may differ between light and dark. Spacing, radii and type sizes are
 * mode-invariant by design — see the design brief, section 4.4.
 */
export const MODE_VARYING_TYPES: ReadonlySet<TokenType> = new Set<TokenType>(["color", "shadow"]);

export const isModeVaryingType = (type: TokenType): boolean => MODE_VARYING_TYPES.has(type);

/**
 * A DTCG alias: the full string value `{group.token}`. Partial interpolation is not part of the
 * spec and is rejected by the resolver.
 */
export type AliasValue = string;

export type ColorValue = string;

/** A CSS length. May be a literal (`1rem`) or a generated `clamp()` expression. */
export type DimensionValue = string;

export type FontFamilyValue = string | string[];

export type FontWeightValue = number | string;

export type NumberValue = number;

export type DurationValue = string;

export type CubicBezierValue = [number, number, number, number];

export interface ShadowLayerValue {
    color: ColorValue;
    offsetX: DimensionValue;
    offsetY: DimensionValue;
    blur: DimensionValue;
    spread: DimensionValue;
    inset?: boolean;
}

export type ShadowValue = ShadowLayerValue | ShadowLayerValue[];

/**
 * Composite typography token. Every sub-property may hold a literal or an alias, which is why the
 * resolver walks into composite values rather than treating them as opaque.
 */
export interface TypographyValue {
    fontFamily: FontFamilyValue | AliasValue;
    fontSize: DimensionValue | AliasValue;
    fontWeight: FontWeightValue | AliasValue;
    lineHeight: NumberValue | DimensionValue | AliasValue;
    letterSpacing: DimensionValue | AliasValue;
}

export type TokenValue =
    | ColorValue
    | DimensionValue
    | FontFamilyValue
    | FontWeightValue
    | NumberValue
    | DurationValue
    | CubicBezierValue
    | ShadowValue
    | TypographyValue;

/** Per-mode overrides. The base `$value` is always the light value. */
export interface ModesExtension {
    dark?: TokenValue;
}

/** Editor metadata. Never emitted into artifacts; carried so the editor can round-trip its state. */
export interface MetaExtension {
    /**
     * Immutable key assigned at creation for primitives and custom semantic tokens. Variable names
     * derive from the key, so display names and paths can change without breaking published output.
     * Canonical slots have no key — their path is core-owned and never changes.
     */
    key?: string;
    /** Human-facing name. Free to change; never affects the emitted variable name. */
    displayName?: string;
    /**
     * Deprecated tokens disappear from every selection surface but keep emitting their last
     * resolved value so existing content renders unchanged. See the design brief, section 8.
     */
    deprecated?: boolean;
    /** Last resolved value, retained as the fallback for a deprecated token. */
    lastResolvedValue?: TokenValue;
    /** Fluid sizing state for a spacing or type-size ramp step. */
    fluid?: FluidStepMeta;
}

export interface FluidStepMeta {
    /** Value at (and below) the minimum viewport. */
    min: DimensionValue;
    /** Value at (and above) the maximum viewport. */
    max: DimensionValue;
    /** When false, `min` and `max` are equal and the step emits a plain length. */
    enabled: boolean;
}

export interface TokenExtensions {
    [MODES_EXTENSION]?: ModesExtension;
    [META_EXTENSION]?: MetaExtension;
    [namespace: string]: unknown;
}

export interface DesignToken {
    $value: TokenValue | AliasValue;
    $type?: TokenType;
    $description?: string;
    $extensions?: TokenExtensions;
}

export type TokenNode = DesignToken | TokenGroup;

/**
 * A DTCG group. `$type` set on a group is inherited by descendants that do not declare their own.
 *
 * The index signature is the price of matching the on-the-wire DTCG format, where child names sit
 * alongside `$`-prefixed metadata in the same object. Use {@link isDesignToken} / {@link isTokenGroup}
 * to narrow before reading a child — no consumer should be indexing this type directly.
 */
export interface TokenGroup {
    $type?: TokenType;
    $description?: string;
    $extensions?: TokenExtensions;
    [childName: string]: TokenNode | TokenType | string | TokenExtensions | undefined;
}

/** The root of a token document. Top-level keys are groups, one per token category. */
export type TokenDocument = TokenGroup;

/** A dot-joined path into the token tree, e.g. `color.action.primary.background`. */
export type TokenPath = string;

/** Viewport range shared by every fluid token in a theme. */
export interface FluidViewportRange {
    /** Minimum viewport width in px. Below this, fluid tokens sit at their minimum. */
    minWidth: number;
    /** Maximum viewport width in px. Above this, fluid tokens sit at their maximum. */
    maxWidth: number;
}
