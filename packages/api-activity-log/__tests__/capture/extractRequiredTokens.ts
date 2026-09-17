/**
 * Pulls every non-optional dependency token out of a source file's `dependencies` arrays.
 *
 * Extracted from the guard so the guard's own matching can be tested. It has been wrong twice, and
 * both failures were false *positives*, which is the direction that does real damage: a guard that
 * cries wolf trains people to widen the allowlist to silence it, which is the opposite of what it
 * is for.
 *
 *   - An early version matched from `dependencies: [` to the next `})` anywhere in the file, which
 *     in a GraphQL factory swept up every capitalised identifier after the array and reported eight
 *     false offenders alongside four real ones.
 *   - It then read capitalised words out of *comments* inside a dependencies array, so explaining
 *     why a dependency was optional reported the explanation as a required dependency.
 */
export const extractRequiredTokens = (source: string): string[] => {
    const tokens: string[] = [];

    // Stops at the array's own closing bracket, tolerating one level of nesting for
    // `[Token, { optional: true }]`.
    // Comments first: a sentence inside the array is prose, not tokens.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

    for (const match of code.matchAll(/dependencies:\s*\[((?:[^[\]]|\[[^\]]*\])*)\]/g)) {
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
