import type { ValidationResult } from "~/domain/artifacts.js";

/**
 * The three W5 validators. Deterministic assertions run on a generated component — without them,
 * generation looks like it works while producing components nobody can edit. All three are pure, so
 * Generate can gate + retry on them and Assemble can re-run the token check across every component.
 */

const normalise = (text: string): string => text.toLowerCase().replace(/\s+/g, " ").trim();

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Punctuation and spacing removed, so a comparison is about words rather than glue. */
const words = (text: string): string => normalise(text).replace(/[^\p{L}\p{N}]/gu, "");

/**
 * Text nodes that are not content, and are excluded before the check runs.
 *
 * Two shapes, both stated so the rule can be argued with:
 *
 * 1. **A lowercase token containing an underscore** — `keyboard_arrow_down`, `attach_money`. That is
 *    the icon-font ligature convention: the glyph is drawn from the text, so the DOM carries a word
 *    the page never shows as words. No English content word contains an underscore.
 * 2. **Anything with neither a letter nor a digit** — bullets, arrows, stray commas, decorative
 *    glyphs.
 *
 * Excluding these is not weakening the gate. They are not text the page displays, so requiring a
 * component to reproduce them measures nothing about fidelity — and under a rendered check they fail
 * for a reason unrelated to dropped content: an icon renders only when its branch has data, so an
 * unobserved icon disappears from the render while the page still shows it.
 *
 * **Deliberately narrow.** The obvious wider rule — any single all-lowercase token — was measured
 * against the five sites and excluded ZIP codes (70119, 02115), years (2026), unit numbers
 * (578, 644, 650) and the word "downtown". All of those are content. It also leaves `refresh`, `add`
 * and `event` checked, which are probably ligatures too; a handful of false failures is the better
 * side to err on, because the other side deletes an address from what the gate protects.
 */
const isIconLigature = (text: string): boolean => /^[a-z0-9]+(_[a-z0-9]+)+$/.test(text.trim());
const isGlyphOnly = (text: string): boolean => !/[\p{L}\p{N}]/u.test(text);

export const isNonContentText = (text: string): boolean =>
    isIconLigature(text) || isGlyphOnly(text);

/**
 * Text preservation: every text the source section showed is put on the page by the component.
 *
 * It is checked against the component **rendered with its values applied**, not against its source
 * code. Checking the code asks the wrong question: a correctly parameterised component does not
 * contain the page's text, because the text arrives as a prop. Measured across five sites, 41% of
 * this validator's failures were components skipped for being properly built — an office-hours
 * component declaring `officeHours: { day, hours }[]` was rejected for not containing the string
 * "Monday: 9:00AM to 6:00PM", which it correctly splits across the two fields it should.
 *
 * `renderedValues` are the values Plan observed on the cluster. They matter because those
 * observations are **deduped per field**: seven days were seen but only three distinct opening
 * hours, so the rows the page displayed cannot be reconstructed from them. Requiring the exact row
 * strings would require information the pipeline does not hold. So a fragment also passes when it is
 * built entirely out of values the component *did* render — the row "Monday: 9:00AM to 6:00PM" is
 * preserved if the component rendered "Monday" and "9:00AM to 6:00PM".
 *
 * This is not a weaker gate. A heading the component dropped is neither in the rendered text nor an
 * observed value, so it still fails. What stopped failing is text that is present, in the place the
 * page will put it.
 */
/**
 * The model writes the page's text into a string literal, so where the page has a curly apostrophe
 * or a line break, the source has a six-character unicode escape or a two-character newline escape.
 * Comparing a fragment against the raw source therefore misses text the component demonstrably
 * contains, and misses it on one character: a freehill privacy-policy fragment matched 704 of its 704
 * characters once decoded.
 *
 * Only the two escapes measured to occur are decoded. Folding curly quotes to ASCII was measured
 * alongside this and changed nothing, so it is deliberately left out.
 *
 * This runs after the strips below, not before: their regexes match string literals with
 * `(?:[^"\\]|\\.)*`, which relies on a quote inside a literal still being escaped.
 */
const decodeStringEscapes = (source: string): string =>
    source
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\\n/g, " ");

/**
 * The component's source with everything that can never reach the page removed: comments, the
 * `description` shown to an editor beside an input, and the `aiContext` blurb.
 *
 * This is the distinction the old check missed. It searched the whole source, so a component passed
 * by carrying the page's paragraphs inside an input's `description` — text the model echoed as an
 * example and the component never renders. One parkcityplace component passed on 22 fragments that
 * exist only in comments and descriptions.
 */
const renderableSource = (source: string): string =>
    decodeStringEscapes(
        source
            .replace(/\/\*[\s\S]*?\*\//g, " ")
            .replace(/\/\/[^\n]*/g, " ")
            .replace(/description:\s*"(?:[^"\\]|\\.)*"/g, " ")
            .replace(/aiContext:\s*"(?:[^"\\]|\\.)*"/g, " ")
    );

export const validateTextPreservation = (
    sourceTexts: string[],
    renderedText: string,
    renderedValues: string[] = [],
    source = ""
): ValidationResult => {
    /*
     * Both lists come out of a stored artifact, and an artifact held in DynamoDB cannot round-trip an
     * empty string: `convertEmptyValues: true` is set for every document client
     * (aws-sdk/client-dynamodb/getDocumentClient.ts) and is deliberately not configurable, so `""`
     * comes back as `null`. A model writing an empty observed value for an optional field — a logo
     * link with no label, say — is therefore enough to hand this function a null.
     *
     * Generate calls it outside any try/catch, so an unguarded null is an uncaught TypeError that
     * fails the stage rather than the component. One such value exists in a stored parkcityplace plan.
     */
    const texts = sourceTexts.filter((text): text is string => typeof text === "string");
    const values = renderedValues.filter((value): value is string => typeof value === "string");

    const haystack = normalise(renderedText ?? "");
    const haystackWords = words(renderedText ?? "");

    /*
     * A single render exercises a single branch. Tabs, filters, empty states and rows beyond the
     * observed data hold text the component will show and this render did not: "No Results Found",
     * "View Amenities", the fourth day of opening hours. Measured, that was most of what the rendered
     * check newly failed.
     *
     * So a fragment also passes when it is in the source with the non-rendering regions stripped. The
     * component demonstrably contains it in code that can render; which branch showed it is not
     * something this gate can or should decide. What stays caught is text that exists only where it
     * can never render, which is what the old whole-source check let through.
     */
    const renderable = normalise(renderableSource(source));

    // Only values the component actually rendered can account for a fragment.
    const rendered = values
        .map(words)
        .filter(value => value.length > 2 && haystackWords.includes(value))
        .sort((a, b) => b.length - a.length);

    const builtFromRenderedValues = (text: string): boolean => {
        let rest = words(text);
        if (rest.length < 3) {
            return false;
        }
        for (const value of rendered) {
            if (rest.includes(value)) {
                rest = rest.replace(value, "");
            }
            if (!rest) {
                return true;
            }
        }
        return false;
    };

    const failures = texts
        .filter(text => {
            if (!text.trim() || isNonContentText(text)) {
                return false;
            }
            if (haystack.includes(normalise(text))) {
                return false;
            }
            // Entity encoding, curly quotes and inline-element spacing all wash out here.
            if (words(text).length > 0 && haystackWords.includes(words(text))) {
                return false;
            }
            if (renderable && renderable.includes(normalise(text))) {
                return false;
            }
            return !builtFromRenderedValues(text);
        })
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
