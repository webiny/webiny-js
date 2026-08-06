import {
    isAlias,
    isDesignToken,
    isShadowValue,
    isTypographyValue,
    parseAlias,
    TYPOGRAPHY_SUB_PROPERTIES,
    type TypographySubProperty
} from "~/dtcg/guards.js";
import { getEffectiveType, getNodeAtPath, getTokenAtPath, walkTokens } from "~/dtcg/traverse.js";
import { removeNodeAtPath, setTokenValue } from "~/dtcg/edit.js";
import {
    MODES_EXTENSION,
    type DesignToken,
    type ShadowLayerValue,
    type ThemeMode,
    type TokenDocument,
    type TokenPath,
    type TokenType,
    type TokenValue,
    type TypographyValue
} from "~/dtcg/types.js";
import {
    aliasCycle,
    aliasDepthExceeded,
    aliasMalformed,
    aliasNotFound,
    aliasTargetIsGroup,
    aliasTypeMismatch,
    type AliasError
} from "./errors.js";

/**
 * Aliases are resolved at publish, never at read. On publish we walk the graph, resolve everything
 * to literals, and store the resolved snapshot on the version. Both artifacts are static outputs of
 * that snapshot, so no consumer resolves anything at runtime and a published version is genuinely
 * immutable. See the design brief, section 4.8.
 */

/** Maximum number of hops in a reference chain. */
export const MAX_ALIAS_DEPTH = 3;

/**
 * Expected `$type` for each sub-property of a composite typography value. `lineHeight` accepts
 * either a unitless number or a length, so it is checked against a set.
 */
const TYPOGRAPHY_SUB_PROPERTY_TYPES: Readonly<
    Record<TypographySubProperty, ReadonlySet<TokenType>>
> = {
    fontFamily: new Set<TokenType>(["fontFamily"]),
    fontSize: new Set<TokenType>(["dimension"]),
    fontWeight: new Set<TokenType>(["fontWeight", "number"]),
    lineHeight: new Set<TokenType>(["number", "dimension"]),
    letterSpacing: new Set<TokenType>(["dimension"])
};

export interface ResolveOptions {
    /** Which mode's values to resolve. Mode-invariant tokens resolve identically in both. */
    mode?: ThemeMode;
    maxDepth?: number;
}

export interface ResolvedToken {
    path: TokenPath;
    type: TokenType | undefined;
    value: TokenValue;
}

export interface ResolveResult {
    mode: ThemeMode;
    /** Fully resolved tokens, keyed by path. A token that failed to resolve is absent. */
    tokens: Map<TokenPath, ResolvedToken>;
    errors: AliasError[];
}

/**
 * The raw value of a token for a given mode. The base `$value` is always the light value; dark
 * comes from the `com.webiny.modes` extension and falls back to the base when absent.
 */
export const valueForMode = (token: DesignToken, mode: ThemeMode): TokenValue => {
    if (mode === "light") {
        return token.$value;
    }
    const dark = token.$extensions?.[MODES_EXTENSION]?.dark;
    return dark ?? token.$value;
};

/** True when the string looks like it was meant to be a reference but is not a well-formed one. */
const looksLikeMalformedAlias = (value: unknown): value is string => {
    return (
        typeof value === "string" && value.includes("{") && value.includes("}") && !isAlias(value)
    );
};

interface ChainOutcome {
    value: TokenValue | undefined;
    type: TokenType | undefined;
    error: AliasError | undefined;
}

/**
 * Follows a reference chain to a literal. `visited` is per-chain, so the same token appearing in
 * two unrelated chains is not mistaken for a cycle.
 */
const followChain = (
    document: TokenDocument,
    origin: TokenPath,
    firstTarget: TokenPath,
    mode: ThemeMode,
    maxDepth: number,
    property?: string
): ChainOutcome => {
    const chain: TokenPath[] = [origin];
    const visited = new Set<TokenPath>([origin]);

    let target = firstTarget;
    let hops = 0;

    for (;;) {
        hops++;
        chain.push(target);

        if (visited.has(target)) {
            return {
                value: undefined,
                type: undefined,
                error: aliasCycle(origin, chain, property)
            };
        }
        visited.add(target);

        if (hops > maxDepth) {
            return {
                value: undefined,
                type: undefined,
                error: aliasDepthExceeded(origin, chain, maxDepth, property)
            };
        }

        const node = getNodeAtPath(document, target);
        if (node === undefined) {
            return {
                value: undefined,
                type: undefined,
                error: aliasNotFound(origin, target, property)
            };
        }
        if (!isDesignToken(node)) {
            return {
                value: undefined,
                type: undefined,
                error: aliasTargetIsGroup(origin, target, property)
            };
        }

        const value = valueForMode(node, mode);
        const nextTarget = parseAlias(value);

        if (nextTarget === null) {
            if (looksLikeMalformedAlias(value)) {
                return {
                    value: undefined,
                    type: undefined,
                    error: aliasMalformed(target, value, property)
                };
            }
            return { value, type: getEffectiveType(document, target), error: undefined };
        }

        target = nextTarget;
    }
};

interface ValueResolution {
    value: TokenValue | undefined;
    errors: AliasError[];
}

const resolveScalar = (
    document: TokenDocument,
    origin: TokenPath,
    raw: unknown,
    expectedTypes: ReadonlySet<TokenType> | undefined,
    mode: ThemeMode,
    maxDepth: number,
    property?: string
): ValueResolution => {
    const target = parseAlias(raw);

    if (target === null) {
        if (looksLikeMalformedAlias(raw)) {
            return { value: undefined, errors: [aliasMalformed(origin, raw, property)] };
        }
        return { value: raw as TokenValue, errors: [] };
    }

    const outcome = followChain(document, origin, target, mode, maxDepth, property);
    if (outcome.error) {
        return { value: undefined, errors: [outcome.error] };
    }

    if (expectedTypes && outcome.type && !expectedTypes.has(outcome.type)) {
        const [expected] = [...expectedTypes];
        return {
            value: undefined,
            errors: [aliasTypeMismatch(origin, target, expected, outcome.type, property)]
        };
    }

    return { value: outcome.value, errors: [] };
};

const resolveTypography = (
    document: TokenDocument,
    origin: TokenPath,
    raw: TypographyValue,
    mode: ThemeMode,
    maxDepth: number
): ValueResolution => {
    const errors: AliasError[] = [];
    const resolved: Record<string, unknown> = {};

    for (const subProperty of TYPOGRAPHY_SUB_PROPERTIES) {
        const result = resolveScalar(
            document,
            origin,
            raw[subProperty],
            TYPOGRAPHY_SUB_PROPERTY_TYPES[subProperty],
            mode,
            maxDepth,
            subProperty
        );

        errors.push(...result.errors);
        if (result.value !== undefined) {
            resolved[subProperty] = result.value;
        }
    }

    if (errors.length > 0) {
        return { value: undefined, errors };
    }

    return { value: resolved as unknown as TypographyValue, errors };
};

const SHADOW_LAYER_TYPES: Readonly<Record<string, ReadonlySet<TokenType>>> = {
    color: new Set<TokenType>(["color"]),
    offsetX: new Set<TokenType>(["dimension"]),
    offsetY: new Set<TokenType>(["dimension"]),
    blur: new Set<TokenType>(["dimension"]),
    spread: new Set<TokenType>(["dimension"])
};

const resolveShadowLayer = (
    document: TokenDocument,
    origin: TokenPath,
    raw: ShadowLayerValue,
    mode: ThemeMode,
    maxDepth: number,
    index: number | undefined
): ValueResolution => {
    const errors: AliasError[] = [];
    const resolved: Record<string, unknown> = {};
    const prefix = index === undefined ? "" : `${index}.`;

    for (const [property, expectedTypes] of Object.entries(SHADOW_LAYER_TYPES)) {
        const result = resolveScalar(
            document,
            origin,
            raw[property as keyof ShadowLayerValue],
            expectedTypes,
            mode,
            maxDepth,
            `${prefix}${property}`
        );

        errors.push(...result.errors);
        if (result.value !== undefined) {
            resolved[property] = result.value;
        }
    }

    if (raw.inset !== undefined) {
        resolved.inset = raw.inset;
    }

    if (errors.length > 0) {
        return { value: undefined, errors };
    }

    return { value: resolved as unknown as ShadowLayerValue, errors };
};

/** Resolves a single token's value for one mode, walking into composite values. */
export const resolveTokenValue = (
    document: TokenDocument,
    path: TokenPath,
    token: DesignToken,
    type: TokenType | undefined,
    options: ResolveOptions = {}
): ValueResolution => {
    const mode = options.mode ?? "light";
    const maxDepth = options.maxDepth ?? MAX_ALIAS_DEPTH;
    const raw = valueForMode(token, mode);

    // A whole-token alias is resolved first: the target may itself be a composite.
    const target = parseAlias(raw);
    if (target !== null) {
        const outcome = followChain(document, path, target, mode, maxDepth);
        if (outcome.error) {
            return { value: undefined, errors: [outcome.error] };
        }
        if (type && outcome.type && outcome.type !== type) {
            return {
                value: undefined,
                errors: [aliasTypeMismatch(path, target, type, outcome.type)]
            };
        }
        return { value: outcome.value, errors: [] };
    }

    if (isTypographyValue(raw)) {
        return resolveTypography(document, path, raw, mode, maxDepth);
    }

    if (isShadowValue(raw)) {
        if (Array.isArray(raw)) {
            const errors: AliasError[] = [];
            const layers: ShadowLayerValue[] = [];

            raw.forEach((layer, index) => {
                const result = resolveShadowLayer(document, path, layer, mode, maxDepth, index);
                errors.push(...result.errors);
                if (result.value !== undefined) {
                    layers.push(result.value as ShadowLayerValue);
                }
            });

            return errors.length > 0 ? { value: undefined, errors } : { value: layers, errors };
        }

        return resolveShadowLayer(document, path, raw, mode, maxDepth, undefined);
    }

    return resolveScalar(document, path, raw, undefined, mode, maxDepth);
};

/**
 * Resolves every token in the document to a literal for one mode. Failures are collected rather
 * than thrown — publish validation reports all of them at once.
 */
export const resolveDocument = (
    document: TokenDocument,
    options: ResolveOptions = {}
): ResolveResult => {
    const mode = options.mode ?? "light";
    const tokens = new Map<TokenPath, ResolvedToken>();
    const errors: AliasError[] = [];

    for (const { path, token, type } of walkTokens(document)) {
        const result = resolveTokenValue(document, path, token, type, { ...options, mode });

        errors.push(...result.errors);
        if (result.value !== undefined) {
            tokens.set(path, { path, type, value: result.value });
        }
    }

    return { mode, tokens, errors };
};

/**
 * Resolves both modes in one pass. Mode-invariant tokens resolve to the same value in both, which
 * the CSS emitter uses to decide what belongs in the dark block.
 */
export const resolveDocumentModes = (
    document: TokenDocument,
    options: Omit<ResolveOptions, "mode"> = {}
): Record<ThemeMode, ResolveResult> => {
    return {
        light: resolveDocument(document, { ...options, mode: "light" }),
        dark: resolveDocument(document, { ...options, mode: "dark" })
    };
};

/** Every path the given token references, directly or through a composite sub-property. */
export const collectReferences = (token: DesignToken, mode: ThemeMode = "light"): TokenPath[] => {
    const raw = valueForMode(token, mode);
    const direct = parseAlias(raw);
    if (direct !== null) {
        return [direct];
    }

    if (isTypographyValue(raw)) {
        return TYPOGRAPHY_SUB_PROPERTIES.map(key => parseAlias(raw[key])).filter(
            (path): path is TokenPath => path !== null
        );
    }

    if (isShadowValue(raw)) {
        const layers = Array.isArray(raw) ? raw : [raw];
        return layers
            .flatMap(layer => Object.values(layer).map(value => parseAlias(value)))
            .filter((path): path is TokenPath => path !== null);
    }

    return [];
};

/**
 * Every token that references `path`, in either mode. Used to hard-block deletion of a primitive
 * that a canonical slot or custom semantic token still points at — see the design brief, section 8.
 */
export const findReferrers = (document: TokenDocument, path: TokenPath): TokenPath[] => {
    const referrers: TokenPath[] = [];

    for (const visited of walkTokens(document)) {
        const references = [
            ...collectReferences(visited.token, "light"),
            ...collectReferences(visited.token, "dark")
        ];

        if (references.includes(path)) {
            referrers.push(visited.path);
        }
    }

    return [...new Set(referrers)];
};

/**
 * Removes `path` and rewrites every direct referrer to the literal value the removed token resolves
 * to, in each mode independently, so the rendered result is unchanged — the "freeze & remove"
 * alternative to hard-blocking deletion of a referenced token (design brief, section 8). A token
 * reached only through an intermediate alias is left alone: the intermediate is what it points at,
 * and the intermediate is not removed.
 *
 * Booleans and freeze values are read from the original document; edits accumulate onto a copy.
 */
export const removeTokenFreezingReferrers = (
    document: TokenDocument,
    path: TokenPath
): TokenDocument => {
    const target = getTokenAtPath(document, path);
    if (!target) {
        return document;
    }

    const light = valueForMode(target, "light");
    const dark = valueForMode(target, "dark");
    const darkDiffers = JSON.stringify(dark) !== JSON.stringify(light);

    let next = document;
    for (const referrerPath of findReferrers(document, path)) {
        const referrer = getTokenAtPath(document, referrerPath);
        if (!referrer) {
            continue;
        }

        const refLight = collectReferences(referrer, "light").includes(path);
        const refDark = collectReferences(referrer, "dark").includes(path);

        if (refLight) {
            next = setTokenValue(next, referrerPath, "light", light);
        }

        if (refDark) {
            // The dark override can be dropped only when the frozen light literal already carries
            // the right dark value — i.e. light was frozen too and the two modes match. Otherwise a
            // dark reference (or an alias that resolved differently in dark) must be pinned outright.
            const coveredByLight = refLight && !darkDiffers;
            next = setTokenValue(next, referrerPath, "dark", coveredByLight ? undefined : dark);
        }
    }

    return removeNodeAtPath(next, path);
};
