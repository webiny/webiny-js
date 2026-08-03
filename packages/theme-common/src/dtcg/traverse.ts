import { children, isDesignToken, isTokenGroup } from "./guards.js";
import type { DesignToken, TokenDocument, TokenNode, TokenPath, TokenType } from "./types.js";

export interface VisitedToken {
    path: TokenPath;
    token: DesignToken;
    /** `$type` declared on the token, or inherited from the nearest ancestor group that declares one. */
    type: TokenType | undefined;
}

export const splitPath = (path: TokenPath): string[] => {
    return path.split(".").filter(segment => segment.length > 0);
};

export const joinPath = (segments: readonly string[]): TokenPath => segments.join(".");

/** Resolves a dot-path to a token or group, or `undefined` when the path does not exist. */
export const getNodeAtPath = (document: TokenDocument, path: TokenPath): TokenNode | undefined => {
    const segments = splitPath(path);
    if (segments.length === 0) {
        return undefined;
    }

    let current: TokenNode = document;
    for (const segment of segments) {
        if (!isTokenGroup(current)) {
            return undefined;
        }
        // Annotated as `unknown` rather than inferred: the group index signature resolves to a
        // union that includes `TokenNode`, which makes the inferred type self-referential.
        const next: unknown = current[segment];
        if (!isDesignToken(next) && !isTokenGroup(next)) {
            return undefined;
        }
        current = next;
    }

    return current;
};

export const getTokenAtPath = (
    document: TokenDocument,
    path: TokenPath
): DesignToken | undefined => {
    const node = getNodeAtPath(document, path);
    return isDesignToken(node) ? node : undefined;
};

/**
 * Resolves the effective `$type` of the node at `path`, walking up through ancestor groups.
 * DTCG lets a group declare a `$type` that its descendants inherit unless they override it.
 */
export const getEffectiveType = (
    document: TokenDocument,
    path: TokenPath
): TokenType | undefined => {
    const segments = splitPath(path);

    let current: TokenNode = document;
    let inherited: TokenType | undefined = document.$type;

    for (const segment of segments) {
        if (!isTokenGroup(current)) {
            return inherited;
        }
        const next: unknown = current[segment];
        if (!isDesignToken(next) && !isTokenGroup(next)) {
            return inherited;
        }
        if (next.$type) {
            inherited = next.$type;
        }
        current = next;
    }

    return inherited;
};

/**
 * Depth-first walk over every token in the document, in declaration order. Groups are traversed
 * but not yielded — only leaves carrying a `$value`.
 */
export function* walkTokens(
    document: TokenDocument,
    inheritedType?: TokenType,
    prefix: readonly string[] = []
): Generator<VisitedToken> {
    const groupType = document.$type ?? inheritedType;

    for (const [name, node] of children(document)) {
        const segments = [...prefix, name];

        if (isDesignToken(node)) {
            yield { path: joinPath(segments), token: node, type: node.$type ?? groupType };
            continue;
        }

        if (isTokenGroup(node)) {
            yield* walkTokens(node, groupType, segments);
        }
    }
}

/** Every token in the document as a path-keyed map. */
export const collectTokens = (document: TokenDocument): Map<TokenPath, VisitedToken> => {
    const result = new Map<TokenPath, VisitedToken>();
    for (const visited of walkTokens(document)) {
        result.set(visited.path, visited);
    }
    return result;
};
