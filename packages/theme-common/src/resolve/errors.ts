import type { TokenPath, TokenType } from "~/dtcg/types.js";

export type AliasErrorCode =
    | "Alias/NotFound"
    | "Alias/TargetIsGroup"
    | "Alias/Cycle"
    | "Alias/DepthExceeded"
    | "Alias/TypeMismatch"
    | "Alias/Malformed";

/**
 * A single resolution failure, addressed to a token path so the editor can link straight to the
 * offending row. Resolution collects every failure rather than throwing on the first, because
 * publish validation wants the full list.
 */
export interface AliasError {
    code: AliasErrorCode;
    /** The token that failed to resolve. */
    path: TokenPath;
    /** Sub-property of a composite value, when the failure is inside one. */
    property?: string;
    message: string;
    /** Full chain walked, for cycle and depth failures. */
    chain?: TokenPath[];
    expectedType?: TokenType;
    actualType?: TokenType;
}

const describe = (path: TokenPath, property?: string): string => {
    return property ? `"${path}.${property}"` : `"${path}"`;
};

export const aliasNotFound = (
    path: TokenPath,
    target: TokenPath,
    property?: string
): AliasError => ({
    code: "Alias/NotFound",
    path,
    property,
    message: `${describe(path, property)} references "${target}", which does not exist.`
});

export const aliasTargetIsGroup = (
    path: TokenPath,
    target: TokenPath,
    property?: string
): AliasError => ({
    code: "Alias/TargetIsGroup",
    path,
    property,
    message: `${describe(path, property)} references "${target}", which is a group, not a token.`
});

export const aliasCycle = (path: TokenPath, chain: TokenPath[], property?: string): AliasError => ({
    code: "Alias/Cycle",
    path,
    property,
    chain,
    message: `${describe(path, property)} forms a reference cycle: ${chain.join(" → ")}.`
});

export const aliasDepthExceeded = (
    path: TokenPath,
    chain: TokenPath[],
    maxDepth: number,
    property?: string
): AliasError => ({
    code: "Alias/DepthExceeded",
    path,
    property,
    chain,
    message: `${describe(path, property)} exceeds the maximum reference depth of ${maxDepth}: ${chain.join(" → ")}.`
});

export const aliasTypeMismatch = (
    path: TokenPath,
    target: TokenPath,
    expectedType: TokenType | undefined,
    actualType: TokenType | undefined,
    property?: string
): AliasError => ({
    code: "Alias/TypeMismatch",
    path,
    property,
    expectedType,
    actualType,
    message:
        `${describe(path, property)} expects type "${expectedType ?? "unknown"}" but references ` +
        `"${target}", which is type "${actualType ?? "unknown"}".`
});

export const aliasMalformed = (path: TokenPath, value: string, property?: string): AliasError => ({
    code: "Alias/Malformed",
    path,
    property,
    message:
        `${describe(path, property)} has the value "${value}". A reference must occupy the whole ` +
        `value, as in "{group.token}" — partial interpolation is not supported.`
});
