/**
 * Pulls every non-optional dependency token out of a source file's `dependencies` arrays.
 *
 * Extracted from the guard so the guard's own matching can be tested. It has already been wrong
 * once: an earlier version matched from `dependencies: [` to the next `})` anywhere in the file,
 * which in a GraphQL factory swept up every capitalised identifier after the array and reported
 * eight false offenders alongside four real ones. A guard that cries wolf trains people to widen
 * the allowlist to silence it, which is the opposite of what it is for.
 */
export const extractRequiredTokens = (source: string): string[] => {
    const tokens: string[] = [];

    // Stops at the array's own closing bracket, tolerating one level of nesting for
    // `[Token, { optional: true }]`.
    for (const match of source.matchAll(/dependencies:\s*\[((?:[^[\]]|\[[^\]]*\])*)\]/g)) {
        const withoutOptional = match[1]!.replace(
            /\[\s*[A-Za-z]+\s*,\s*\{[^}]*optional:\s*true[^}]*\}\s*\]/g,
            ""
        );

        for (const token of withoutOptional.matchAll(/\b([A-Z][A-Za-z]+)\b/g)) {
            tokens.push(token[1]!);
        }
    }

    return tokens;
};
