import type { ScopeRegistry } from "~/features/scopes/abstractions.js";
import { SqlFragment } from "./SqlFragment.js";
import type { TextMode } from "./lexemes.js";
import {
    MIN_SUFFIX_LENGTH,
    pairLexeme,
    phrasesOf,
    splitWords,
    suffixLexeme,
    textModeOf,
    wordLexeme
} from "./lexemes.js";

interface ISearchField {
    key: string;
    mode: TextMode;
    phrases: boolean;
}

const quote = (lexeme: string): string => `'${lexeme}'`;

interface ITermWord {
    word: string;
    /* Written with a leading `*`: matches text inside words. */
    inside: boolean;
    /* Written with a trailing `*`: matches word starts. */
    prefix: boolean;
}

interface ITermParts {
    words: ITermWord[];
    phrases: string[][];
}

/* Quoted parts are phrases; an unmatched quote is ignored. `*` at either end of a word is a wildcard. */
const parseTerm = (term: string): ITermParts => {
    const segments = term.split('"');
    const hasUnmatchedQuote = segments.length % 2 === 0;
    const words: ITermWord[] = [];
    const phrases: string[][] = [];
    segments.forEach((segment, index) => {
        const isQuoted = index % 2 === 1 && !(hasUnmatchedQuote && index === segments.length - 1);
        if (isQuoted) {
            const segmentWords = splitWords(segment);
            if (segmentWords.length > 0) {
                phrases.push(segmentWords);
            }
            return;
        }
        for (const token of segment.split(/\s+/)) {
            const parts = splitWords(token);
            parts.forEach((word, position) => {
                words.push({
                    word,
                    inside: position === 0 && token.startsWith("*"),
                    prefix: position === parts.length - 1 && token.endsWith("*")
                });
            });
        }
    });
    return { words, phrases };
};

/**
 * Full-text search over the `tsv` column: every word of the term must match a word of one of the
 * requested fields (AND across words, OR across fields). Words match whole words, except the word
 * being typed (the last one, when the term doesn't end in a space or quote), which matches word
 * starts. A prefix match reads every word with that start, which on a large model costs seconds when
 * several common words are prefixes (benchmark C12). In "full" fields a word of 3+ characters also
 * matches text inside words. A quoted phrase must appear in one field: on a field with phrases
 * as whole words next to each other and in order (word-pair lexemes, so it is an index lookup); on
 * other fields as words in any order. The tsquery is a literal, so the planner can estimate how
 * common the words are.
 *
 * Wildcards: `hel*` matches word starts. `*ello` (or `*ell*`) matches text inside words: through the
 * suffix lexemes in "full" fields (an index lookup); in other fields, and for parts shorter than
 * MIN_SUFFIX_LENGTH, by testing each row's words (a scan of the model's rows, fast on small and lean
 * models, a walk of the sort order on big ones). The scan sees the indexed words: lowercased and
 * split on punctuation, so a wildcard part never spans two words.
 */
export const compileSearch = (
    scope: ScopeRegistry.Scope,
    term: string | undefined,
    fields: string[] | undefined
): SqlFragment | null => {
    if (!term || !fields || fields.length === 0) {
        return null;
    }
    const { words, phrases } = parseTerm(term);
    if (words.length === 0 && phrases.length === 0) {
        return null;
    }
    const searchFields: ISearchField[] = fields
        .filter(field => scope.slotMap.ft[field])
        .map(field => ({
            key: scope.slotMap.ft[field],
            mode: textModeOf(scope.readPlan.paths[field]),
            phrases: phrasesOf(scope.readPlan.paths[field])
        }));
    if (searchFields.length === 0) {
        return new SqlFragment("FALSE");
    }
    const { scopeId } = scope;
    // The last word is still being typed unless the term ends in a space or a quote.
    const typing = words.length > 0 && !/[\s"]$/.test(term);
    const hasSuffixes = (word: string, field: ISearchField) =>
        field.mode === "full" && word.length >= MIN_SUFFIX_LENGTH;
    // Text inside a word, through the index: the field's suffixes (and word starts).
    const insideInField = (word: string, { key }: ISearchField): string =>
        `${quote(wordLexeme(scopeId, key, word))}:* | ${quote(suffixLexeme(scopeId, key, word))}:*`;
    // One word in one field: the word or its start; in "full" fields also text inside a word.
    const wordInField = (word: string, field: ISearchField, prefix: boolean): string => {
        const start = `${quote(wordLexeme(scopeId, field.key, word))}${prefix ? ":*" : ""}`;
        return hasSuffixes(word, field)
            ? `${start} | ${quote(suffixLexeme(scopeId, field.key, word))}:*`
            : start;
    };
    // A quoted phrase in one field.
    const phraseInField = (phrase: string[], field: ISearchField): string => {
        const { key } = field;
        if (!field.phrases) {
            return phrase.map(word => `(${wordInField(word, field, false)})`).join(" & ");
        }
        if (phrase.length === 1) {
            return quote(wordLexeme(scopeId, key, phrase[0]));
        }
        const pairs = phrase
            .slice(0, -1)
            .map((word, index) => quote(pairLexeme(scopeId, key, word, phrase[index + 1])));
        if (phrase.length === 2) {
            return pairs[0];
        }
        // Pairs narrow through the index; positions confirm the pairs are in one run.
        const chain = phrase.map(word => quote(wordLexeme(scopeId, key, word))).join(" <-> ");
        return `${pairs.join(" & ")} & (${chain})`;
    };

    // Words and phrases the index answers, ANDed into one tsquery.
    const indexed: string[] = [];
    // Wildcard words tested on each row.
    const scanned: SqlFragment[] = [];
    words.forEach(({ word, inside, prefix }, index) => {
        if (!inside) {
            const last = index === words.length - 1;
            indexed.push(
                `(${searchFields
                    .map(field => wordInField(word, field, prefix || (last && typing)))
                    .join(" | ")})`
            );
            return;
        }
        // Through the index when every field has the suffixes, otherwise by testing each row.
        if (searchFields.every(field => hasSuffixes(word, field))) {
            indexed.push(`(${searchFields.map(field => insideInField(word, field)).join(" | ")})`);
            return;
        }
        // The row's lexemes as text ('<scope>_<key>_<word>' ...): one of the fields' words contains it.
        scanned.push(
            new SqlFragment("tsv::text ~ ?", [
                `'${scopeId}_(${searchFields.map(field => field.key).join("|")})_[^']*${word}`
            ]).estimateAs({ kind: "share", share: 1 })
        );
    });
    indexed.push(
        ...phrases.map(
            phrase =>
                `(${searchFields.map(field => `(${phraseInField(phrase, field)})`).join(" | ")})`
        )
    );

    // Each part estimated on its own: lexemes are scope-prefixed, so the planner's estimate of the
    // whole query treats words of one model as independent across the table and comes out far low.
    const indexedParts = indexed.map(part => new SqlFragment("tsv @@ ?::tsquery", [part], true));
    const indexedFragment =
        indexed.length > 0
            ? new SqlFragment("tsv @@ ?::tsquery", [indexed.join(" & ")], true)
            : null;
    if (scanned.length === 0 && indexedFragment) {
        return indexed.length === 1
            ? indexedFragment
            : indexedFragment.estimateAs({ kind: "and", parts: indexedParts });
    }
    return SqlFragment.join(
        indexedFragment ? [indexedFragment, ...scanned] : scanned,
        " AND "
    ).estimateAs({ kind: "and", parts: [...indexedParts, ...scanned] });
};
