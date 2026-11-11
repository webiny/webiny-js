import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";
import type { IIndexPath } from "~/features/indexPlan/createIndexPlan.js";

/**
 * How a field is indexed for text search.
 * - "full": words, plus every word suffix of MIN_SUFFIX_LENGTH+ characters, so a term matches anywhere
 *   inside a word ("aptop" finds "laptop").
 * - "words": words only; a term matches whole words and word starts.
 * Independently, a field with phrases (see IIndexPath.phrases) also gets word positions and a lexeme
 * per pair of neighbouring words, so a quoted phrase is an index lookup.
 */
export type TextMode = "full" | "words";

export const MIN_SUFFIX_LENGTH = 3;
/* Longer words (URLs, ids) get no suffixes: they would add one lexeme per character. */
export const MAX_SUFFIX_WORD_LENGTH = 32;
/* Postgres keeps at most 256 positions per lexeme. */
const MAX_POSITIONS_PER_LEXEME = 255;
/* Postgres rejects lexemes over 2 KB; longer "words" (encoded data, not text) are not indexed. */
const MAX_WORD_LENGTH = 255;

export interface IFullTextValue {
    text: string;
    mode: TextMode;
    phrases?: boolean;
}

/*
 * Text fields opted in with `settings.search.substrings` are indexed in "full" mode. Every other field
 * uses "words": suffixes add about 40% of a row's index keys (and as much write time), and suffixes
 * of ids would let short terms match unrelated entries.
 */
export const textModeOf = (indexPath: IIndexPath | undefined): TextMode => {
    if (!indexPath || indexPath.system) {
        return "words";
    }
    return indexPath.substrings === true && getBaseFieldType(indexPath.field) === "text"
        ? "full"
        : "words";
};

export const phrasesOf = (indexPath: IIndexPath | undefined): boolean =>
    indexPath?.phrases === true;

/* The same splitting is used for indexing and for queries. */
export const splitWords = (text: string): string[] => {
    return text
        .toLowerCase()
        .split(/[^\p{L}\p{N}_]+/u)
        .filter(Boolean);
};

export const wordLexeme = (scopeId: number, key: string, word: string): string => {
    return `${scopeId}_${key}_${word}`;
};

export const suffixLexeme = (scopeId: number, key: string, suffix: string): string => {
    return `${scopeId}_${key}~${suffix}`;
};

/* Two neighbouring words, at the position of the first. */
export const pairLexeme = (scopeId: number, key: string, first: string, second: string): string => {
    return `${scopeId}_${key}=${first}_${second}`;
};

/* Marks a field that has words without (all) lexemes, so text filters recheck its rows. */
export const longWordLexeme = (scopeId: number, key: string): string => {
    return `${scopeId}_${key}#long`;
};

const quote = (lexeme: string): string => `'${lexeme.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;

/**
 * Builds the `tsv` value as a tsvector literal of scope- and field-prefixed lexemes. Fields with
 * phrases carry word positions (1-based, per field; Postgres clamps them at 16,383) and pair lexemes;
 * other fields carry lexemes only.
 */
export const buildTsvector = (
    scopeId: number,
    fullText: Record<string, IFullTextValue>
): string => {
    // Lexeme -> positions; null for lexemes of fields without phrases.
    const positions = new Map<string, number[] | null>();
    for (const [key, { text, mode, phrases }] of Object.entries(fullText)) {
        const add = (lexeme: string, position: number) => {
            if (!phrases) {
                positions.set(lexeme, null);
                return;
            }
            const list = positions.get(lexeme);
            if (!list) {
                positions.set(lexeme, [position]);
            } else if (list.length < MAX_POSITIONS_PER_LEXEME) {
                list.push(position);
            }
        };
        const words = splitWords(text);
        words.forEach((word, index) => {
            const position = index + 1;
            if (word.length > MAX_WORD_LENGTH) {
                add(longWordLexeme(scopeId, key), position);
                return;
            }
            add(wordLexeme(scopeId, key, word), position);
            const next = words[index + 1];
            if (phrases && next !== undefined && next.length <= MAX_WORD_LENGTH) {
                add(pairLexeme(scopeId, key, word, next), position);
            }
            if (mode !== "full") {
                return;
            }
            if (word.length > MAX_SUFFIX_WORD_LENGTH) {
                add(longWordLexeme(scopeId, key), position);
                return;
            }
            for (let start = 1; word.length - start >= MIN_SUFFIX_LENGTH; start++) {
                add(suffixLexeme(scopeId, key, word.slice(start)), position);
            }
        });
    }
    return [...positions]
        .map(([lexeme, list]) => (list ? `${quote(lexeme)}:${list.join(",")}` : quote(lexeme)))
        .join(" ");
};

const quoteQuery = (lexeme: string): string => `'${lexeme}'`;

/**
 * An index condition for a `contains` or `startsWith` filter on a text field with a full-text key.
 * Every run of word characters in the needle is part of one word of a matching value, so:
 * - startsWith: each part starts a word;
 * - contains, "full" field: each part of MIN_SUFFIX_LENGTH+ characters starts a word or is the start
 *   of a suffix (text inside a word). Shorter parts are left to the ILIKE check;
 * - contains, "words" field: each part starts a word. This is what `contains` means on such a field:
 *   "the" finds "hello there", "ello" does not find "hello".
 * The caller keeps the ILIKE check. Rows of a field with words too long to index (the `#long` marker)
 * always qualify. Returns null when the needle gives the index nothing to check.
 */
export const compileTextPrefilter = (
    scopeId: number,
    key: string,
    operation: "contains" | "startsWith",
    needle: string,
    mode: TextMode
): string | null => {
    const parts = splitWords(needle);
    if (operation === "startsWith" || mode === "words") {
        if (parts.length === 0) {
            return null;
        }
        const all = parts
            .map(part => `${quoteQuery(wordLexeme(scopeId, key, part))}:*`)
            .join(" & ");
        return `(${all}) | ${quoteQuery(longWordLexeme(scopeId, key))}`;
    }
    const indexed = parts.filter(part => part.length >= MIN_SUFFIX_LENGTH);
    if (indexed.length === 0) {
        return null;
    }
    const all = indexed
        .map(part => {
            const word = quoteQuery(wordLexeme(scopeId, key, part));
            const suffix = quoteQuery(suffixLexeme(scopeId, key, part));
            return `(${word}:* | ${suffix}:*)`;
        })
        .join(" & ");
    return `(${all}) | ${quoteQuery(longWordLexeme(scopeId, key))}`;
};
