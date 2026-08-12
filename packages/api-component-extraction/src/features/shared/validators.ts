import type { ValidationResult } from "~/domain/artifacts.js";

/**
 * The three W5 validators. Deterministic assertions run on a generated component — without them,
 * generation looks like it works while producing components nobody can edit. All three are pure, so
 * Generate can gate + retry on them and Assemble can re-run the token check across every component.
 */

const normalise = (text: string): string => text.toLowerCase().replace(/\s+/g, " ").trim();

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Text preservation: every text node present in the source section appears in the generated output.
 * Catches paraphrasing and dropped list items — which a visual comparison barely registers.
 */
export const validateTextPreservation = (
    sourceTexts: string[],
    generatedSource: string
): ValidationResult => {
    const haystack = normalise(generatedSource);
    const failures = sourceTexts
        .filter(text => text.trim().length > 0 && !haystack.includes(normalise(text)))
        .map(text => `missing text: "${text.slice(0, 40)}"`);
    return { passed: failures.length === 0, failures };
};

/**
 * Contract conformance: the generated component exposes every prop its contract declared. This is the
 * failure a human reviewer cannot see — a hero with hardcoded copy looks correct in a screenshot and is
 * useless the first time someone edits it.
 */
export const validateContractConformance = (
    propNames: string[],
    generatedSource: string
): ValidationResult => {
    const failures = propNames
        .filter(name => name.trim().length > 0)
        .filter(name => !new RegExp(`\\b${escapeRegExp(name)}\\b`).test(generatedSource))
        .map(name => `missing prop: "${name}"`);
    return { passed: failures.length === 0, failures };
};

/**
 * Token binding: every `var(--wby-*)` reference in the generated CSS resolves to a css variable present
 * in the theme manifest. The existing `validateComponentSource` checks structure only, not token names.
 */
export const validateTokenBinding = (
    css: string,
    validVariables: Set<string>
): ValidationResult => {
    const used = [...css.matchAll(/var\(\s*(--wby-[a-z0-9-]+)/gi)].map(match =>
        match[1].toLowerCase()
    );
    const failures = [...new Set(used)]
        .filter(variable => !validVariables.has(variable))
        .map(variable => `unknown token variable: ${variable}`);
    return { passed: failures.length === 0, failures };
};
