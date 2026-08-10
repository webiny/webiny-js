import {
    isDesignToken,
    isTokenGroup,
    isTypographyValue,
    toAlias,
    type TypographySubProperty
} from "./guards.js";
import { splitPath } from "./traverse.js";
import {
    META_EXTENSION,
    MODES_EXTENSION,
    type DesignToken,
    type FluidStepMeta,
    type ThemeMode,
    type TokenDocument,
    type TokenGroup,
    type TokenPath,
    type TokenValue
} from "./types.js";

/**
 * Immutable edits to a token document.
 *
 * The editor holds the whole document in memory and saves it back wholesale, so every edit returns
 * a new document rather than mutating in place — that keeps MobX change detection honest and makes
 * an in-flight save immune to a subsequent keystroke.
 */

const cloneGroup = (group: TokenGroup): TokenGroup => ({ ...group });

/** Replaces the node at `path`, creating intermediate groups as needed. */
export const setNodeAtPath = (
    document: TokenDocument,
    path: TokenPath,
    node: DesignToken
): TokenDocument => {
    const segments = splitPath(path);
    if (segments.length === 0) {
        throw new Error("Cannot set a token at an empty path.");
    }

    const next = cloneGroup(document);
    let cursor = next;

    for (const segment of segments.slice(0, -1)) {
        const child: unknown = cursor[segment];
        const childGroup = isTokenGroup(child) ? cloneGroup(child) : ({} as TokenGroup);
        cursor[segment] = childGroup;
        cursor = childGroup;
    }

    cursor[segments[segments.length - 1]] = node;

    return next;
};

/** Removes the node at `path`. Missing paths are a no-op. */
export const removeNodeAtPath = (document: TokenDocument, path: TokenPath): TokenDocument => {
    const segments = splitPath(path);
    if (segments.length === 0) {
        return document;
    }

    const next = cloneGroup(document);
    let cursor = next;

    for (const segment of segments.slice(0, -1)) {
        const child: unknown = cursor[segment];
        if (!isTokenGroup(child)) {
            return document;
        }
        const childGroup = cloneGroup(child);
        cursor[segment] = childGroup;
        cursor = childGroup;
    }

    delete cursor[segments[segments.length - 1]];

    return next;
};

const readToken = (document: TokenDocument, path: TokenPath): DesignToken | undefined => {
    const segments = splitPath(path);
    let cursor: unknown = document;

    for (const segment of segments) {
        if (!isTokenGroup(cursor)) {
            return undefined;
        }
        cursor = cursor[segment];
    }

    return isDesignToken(cursor) ? cursor : undefined;
};

/**
 * Sets one token's value for one mode, preserving everything else on the token.
 *
 * Setting the light value writes `$value`; setting dark writes into the modes extension. Passing
 * `undefined` for dark clears the override, so the token falls back to its light value.
 */
export const setTokenValue = (
    document: TokenDocument,
    path: TokenPath,
    mode: ThemeMode,
    value: TokenValue | undefined
): TokenDocument => {
    const existing = readToken(document, path);
    if (!existing) {
        throw new Error(`Cannot set a value on "${path}" — no such token.`);
    }

    if (mode === "light") {
        if (value === undefined) {
            throw new Error(`"${path}" must have a light value.`);
        }
        return setNodeAtPath(document, path, { ...existing, $value: value });
    }

    const extensions = { ...existing.$extensions };
    const modes = { ...extensions[MODES_EXTENSION] };

    if (value === undefined) {
        delete modes.dark;
    } else {
        modes.dark = value;
    }

    if (Object.keys(modes).length === 0) {
        delete extensions[MODES_EXTENSION];
    } else {
        extensions[MODES_EXTENSION] = modes;
    }

    const next: DesignToken = { ...existing };
    if (Object.keys(extensions).length === 0) {
        delete next.$extensions;
    } else {
        next.$extensions = extensions;
    }

    return setNodeAtPath(document, path, next);
};

/**
 * Updates a ramp step's fluid state.
 *
 * Turning scaling off collapses the maximum onto the minimum, which is what makes the step emit a
 * plain length instead of a `clamp()` — see the design brief, section 4.5. Turning it back on
 * restores the supplied maximum.
 */
export const setTokenFluid = (
    document: TokenDocument,
    path: TokenPath,
    fluid: FluidStepMeta
): TokenDocument => {
    const existing = readToken(document, path);
    if (!existing) {
        throw new Error(`Cannot set fluid state on "${path}" — no such token.`);
    }

    const normalised: FluidStepMeta = fluid.enabled ? fluid : { ...fluid, max: fluid.min };

    return setNodeAtPath(document, path, {
        ...existing,
        // The token's own `$value` tracks the minimum, so a consumer that ignores fluid metadata
        // still gets a usable length.
        $value: normalised.min,
        $extensions: {
            ...existing.$extensions,
            [META_EXTENSION]: { ...existing.$extensions?.[META_EXTENSION], fluid: normalised }
        }
    });
};

/**
 * Sets one sub-property of a composite typography token, leaving the other four alone.
 *
 * The editor changes a role's weight or its size independently, so a whole-value write would make
 * every field clobber its neighbours.
 */
export const setTypographySubProperty = (
    document: TokenDocument,
    path: TokenPath,
    subProperty: TypographySubProperty,
    value: TokenValue
): TokenDocument => {
    const existing = readToken(document, path);
    if (!existing) {
        throw new Error(`Cannot edit "${path}" — no such token.`);
    }
    if (!isTypographyValue(existing.$value)) {
        throw new Error(`"${path}" is not a composite typography token.`);
    }

    return setNodeAtPath(document, path, {
        ...existing,
        $value: { ...existing.$value, [subProperty]: value }
    });
};

/**
 * Writes a whole generated ramp back into the document in one pass.
 *
 * Regenerating from a base size and ratio touches every step, so this exists to avoid nine
 * successive document clones — and to keep the operation atomic from the editor's point of view.
 */
export const applyRamp = (
    document: TokenDocument,
    pathPrefix: string,
    steps: ReadonlyArray<{ step: string } & FluidStepMeta>
): TokenDocument => {
    return steps.reduce((next, step) => {
        const path = `${pathPrefix}.${step.step}`;
        // A step the document does not have is skipped rather than created: ramp cardinality is
        // fixed, so an unknown step means the caller and the schema disagree.
        return readToken(next, path)
            ? setTokenFluid(next, path, {
                  min: step.min,
                  max: step.max,
                  enabled: step.enabled
              })
            : next;
    }, document);
};

/** Points a token at another token, replacing whatever literal or reference it held. */
export const setTokenReference = (
    document: TokenDocument,
    path: TokenPath,
    mode: ThemeMode,
    target: TokenPath
): TokenDocument => {
    return setTokenValue(document, path, mode, toAlias(target));
};

/**
 * Sets or clears a token's usage-guidance `$description`.
 *
 * Functional content, not decoration: it is what the generation model reads to decide which token to
 * bind (see the change brief, C5). An empty string clears it, so a canonical slot can be reset to no
 * override rather than being stuck with a blank one.
 */
export const setTokenDescription = (
    document: TokenDocument,
    path: TokenPath,
    description: string
): TokenDocument => {
    const existing = readToken(document, path);
    if (!existing) {
        throw new Error(`Cannot describe "${path}" — no such token.`);
    }

    const next: DesignToken = { ...existing };
    const trimmed = description.trim();
    if (trimmed) {
        next.$description = trimmed;
    } else {
        delete next.$description;
    }

    return setNodeAtPath(document, path, next);
};
