import type { ValidationResult } from "~/domain/artifacts.js";

/**
 * The three W5 validators. Deterministic assertions run on a generated component — without them,
 * generation looks like it works while producing components nobody can edit. All three are pure, so
 * Generate can gate + retry on them and Assemble can re-run the token check across every component.
 */

/*
 * Tolerates a non-string: a stored plan carried a `null` observed value (webiny.com, 2026-10-09), and
 * lowercasing it crashed the component's generation after every model call, unlogged, until the
 * coordinator gave up.
 */
const normalise = (text: unknown): string =>
    (typeof text === "string" ? text : "").toLowerCase().replace(/\s+/g, " ").trim();

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
            // Not after a colon: `https://` inside a string literal is a URL, not a comment. Stripping it
            // as one removed the rest of the line, and with it the text after every link in a rich text
            // default (Take 3's location highlight failed on "in Bridgeport. When you call…").
            .replace(/(?<!:)\/\/[^\n]*/g, " ")
            .replace(/description:\s*"(?:[^"\\]|\\.)*"/g, " ")
            .replace(/aiContext:\s*"(?:[^"\\]|\\.)*"/g, " ")
    );

/**
 * The texts a component is actually asked to reproduce.
 *
 * `isNonContentText` was written to keep icon ligatures and bare punctuation out of the text
 * **check**, with the comment explaining that requiring them "measures nothing about fidelity". The
 * exclusion was never applied to the **prompt**, so the model was still told to preserve them exactly
 * — and, being unchecked, never told it was wrong to. Measured across the four demo sites, 16 of 34
 * components carried such strings and they render as literal words: 71 Westland's filter bar read
 * "Bedrooms keyboard_arrow_down" and "Bathrooms attach_money".
 *
 * Filtering here rather than at each call site, so the prompt and the check cannot drift apart again.
 * It also stops the preserved-text limit being spent on a comma.
 */
export const textsToPreserve = (texts: string[]): string[] =>
    texts.filter((text): text is string => typeof text === "string" && !isNonContentText(text));

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
 * Values rendered as `[object Object]`: an object input used where a string belongs.
 *
 * The case it exists for is an image. A file input's value is an object (`{ url, ... }`), and a
 * component that reads it as the URL — `src={logo.src}`, `url(${image.src})` — renders
 * `[object Object]` into the attribute or the style, so the image is blank while every other check
 * passes. Measured across five sites, that blanked a header logo, two hero backgrounds and four
 * content photos. It is read off the component rendered with its values, so it sees what an instance
 * would put on the page, wherever in the markup it lands.
 */
export const validateRenderedValues = (markup: string): ValidationResult => {
    const failures = new Set<string>();
    for (const match of markup.matchAll(/\[object Object\]/g)) {
        const before = markup.slice(0, match.index);
        const tagStart = before.lastIndexOf("<");
        const inTag = tagStart > before.lastIndexOf(">");
        const attribute = inTag ? /([a-zA-Z-]+)="[^"]*$/.exec(before)?.[1] : undefined;
        const tag = inTag ? /^<([a-zA-Z0-9-]+)/.exec(before.slice(tagStart))?.[1] : undefined;
        const where =
            attribute === "style"
                ? `the inline style of <${tag}>`
                : attribute
                  ? `the ${attribute} attribute of <${tag}>`
                  : "the text";
        failures.add(
            `an object value rendered as "[object Object]" in ${where} — a file input's value is an object: read its URL as \`.url\` (e.g. \`image.url\`, or \`logo.src.url\` for a file field named src)`
        );
    }
    return { passed: failures.size === 0, failures: [...failures] };
};

/**
 * Every image input puts its image on the page.
 *
 * The other half of `validateRenderedValues`. A component can read a file input in a shape the editor
 * never stores — one wrote a default of `{ url, src }` and read `.src` — and once the render is given
 * what an instance holds (`{ url }` only), that component renders no image at all and no marker either.
 * So each file input's URL has to appear in the markup, as an attribute or in a style. A list input
 * (a carousel) passes when any of its items does, since a carousel shows one slide.
 */
export const validateRenderedFiles = (
    markup: string,
    files: { path: string; urls: string[]; list: boolean }[]
): ValidationResult => {
    // React escapes `&` in attributes, and Cloudinary URLs are full of them.
    const shown = (url: string) =>
        markup.includes(url) || markup.includes(url.replace(/&/g, "&amp;"));
    const failures = files
        .filter(file => (file.list ? !file.urls.some(shown) : !file.urls.every(shown)))
        .map(
            file =>
                `image input "${file.path}" was given ${file.urls[0]} and the component did not render it — a file input's value is \`{ url }\` and nothing else: read \`${file.path.replace(/\[\]/g, "")}.url\``
        );
    return { passed: failures.length === 0, failures };
};

/** The text a section shows: what an invented fragment is measured against. */
export const sourceTextPool = (planned: {
    sourceTexts?: string[];
    clusterTexts?: string[];
    props?: {
        observedValues?: string[];
        observedStructured?: unknown[];
        fields?: unknown[];
    }[];
}): string[] => {
    const out: string[] = [...(planned.sourceTexts ?? []), ...(planned.clusterTexts ?? [])];
    const fromProps = (props: typeof planned.props): void => {
        for (const prop of props ?? []) {
            out.push(...(prop.observedValues ?? []));
            for (const value of (prop.observedStructured ?? []) as Record<string, unknown>[]) {
                for (const key of ["label", "alt"]) {
                    if (typeof value[key] === "string") {
                        out.push(value[key] as string);
                    }
                }
                for (const field of Object.values(
                    (value.fields ?? {}) as Record<string, unknown>
                )) {
                    if (typeof field === "string") {
                        out.push(field);
                    } else if (field && typeof (field as { label?: unknown }).label === "string") {
                        out.push((field as { label: string }).label);
                    }
                }
            }
            fromProps(prop.fields as typeof planned.props);
        }
    };
    fromProps(planned.props);
    // Only strings: a stored plan can carry a null value, and every reader of the pool lowercases it.
    return out.filter((text): text is string => typeof text === "string");
};

const decodeEntities = (text: string): string =>
    text
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;|&#39;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&amp;/g, "&");

const normalizeWords = (text: string): string =>
    text
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[^a-z0-9']+/g, " ")
        .trim();

/** Form furniture: a field's label or option is the page's placeholder, which the capture does not read. */
const FORM_TAGS = new Set(["option", "label", "select", "textarea", "legend"]);
const VOID_TAGS = new Set(["img", "br", "hr", "input", "meta", "link", "source", "wbr"]);
/** Words too common to say whether a fragment came from the page. */
const STOP_WORDS = new Set([
    "the",
    "and",
    "for",
    "you",
    "your",
    "our",
    "with",
    "are",
    "all",
    "from",
    "that",
    "this",
    "into",
    "out",
    "get",
    "now"
]);
/** A fragment counts as the page's when this share of its words is the page's. */
const KNOWN_WORDS = 0.8;

/** Each text run in rendered markup, outside form furniture. */
const renderedFragments = (markup: string): string[] => {
    const fragments: string[] = [];
    const open: string[] = [];
    for (const part of markup.split(/(<[^>]+>)/)) {
        if (part.startsWith("<")) {
            const tag = /^<\/?([a-zA-Z0-9-]+)/.exec(part)?.[1]?.toLowerCase();
            if (!tag) {
                continue;
            }
            if (part.startsWith("</")) {
                const at = open.lastIndexOf(tag);
                if (at >= 0) {
                    open.length = at;
                }
            } else if (!part.endsWith("/>") && !VOID_TAGS.has(tag)) {
                open.push(tag);
            }
            continue;
        }
        const text = decodeEntities(part).replace(/\s+/g, " ").trim();
        if (text && !open.some(tag => FORM_TAGS.has(tag))) {
            fragments.push(text);
        }
    }
    return fragments;
};

/**
 * No text the page does not show.
 *
 * Text preservation asks whether the section's text is on the rendered component; nothing asked the
 * converse, and the model fills a sparse crop with plausible copy. Freehill's header gained an "Apply
 * Now" button in two separate runs, and a photo-only block gained a panel reading "A Place to Call
 * Home" with a sentence of marketing copy — every check green.
 *
 * Each text run in the render is measured against the section's own text, its other instances' and
 * the values Plan observed. A run of two or more words counts as the page's when it appears there, or
 * when nearly all its words do — so a footer's "Copyright © 2026 71 Westland Apartments", assembled
 * from separate source runs, is not invented. Form labels and options are left out: a field's label is
 * a placeholder on the page, and the capture does not read placeholders.
 *
 * Swept over 93 generated components: it flags the three that invented copy, and two whose text is
 * real but not captured as text — a date field's placeholder, and words drawn inside a floor-plan image.
 */
export const validateNoInventedText = (markup: string, pool: string[]): ValidationResult => {
    if (!markup) {
        return { passed: true, failures: [] };
    }
    const corpus = ` | ${pool.map(normalizeWords).join(" | ")} | `;
    const words = new Set(corpus.split(/[ |]+/).filter(Boolean));
    const invented = [...new Set(renderedFragments(markup))].filter(fragment => {
        const normalized = normalizeWords(fragment);
        const lettered = normalized.split(" ").filter(word => /[a-z]/.test(word));
        if (
            lettered.length < 2 ||
            corpus.includes(` ${normalized} `) ||
            corpus.includes(normalized)
        ) {
            return false;
        }
        const content = lettered.filter(word => word.length >= 3 && !STOP_WORDS.has(word));
        if (content.length === 0) {
            return true;
        }
        return content.filter(word => words.has(word)).length / content.length < KNOWN_WORDS;
    });
    return {
        passed: invented.length === 0,
        failures: invented.map(
            fragment =>
                `text not on the source page: "${fragment.slice(0, 120)}" — remove it; use only the section's own text`
        )
    };
};

/** Two results as one: passed only if both did. */
export const combineValidation = (a: ValidationResult, b: ValidationResult): ValidationResult => ({
    passed: a.passed && b.passed,
    failures: [...a.failures, ...b.failures]
});

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
