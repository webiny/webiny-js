/**
 * Turns a search term typed by a user into a query string query.
 * @see https://opensearch.org/docs/latest/query-dsl/full-text/query-string/
 *
 * Text is indexed with the standard analyzer, because `getBaseConfiguration()` sets no other one.
 * It splits text into words on spaces and punctuation, so "Roadtest: Best Cars" is indexed as
 * "roadtest", "best" and "cars". The first and the last word of the query get a wildcard, and
 * wildcard terms are not split by the analyzer, so a term like "Roadtest\:*" looks for a single
 * word with a colon in it, which was never indexed. Instead of escaping punctuation, we turn it
 * into spaces and search for the words the analyzer indexed.
 *
 * The rules below follow the standard analyzer. An index configured with a different analyzer
 * splits words differently, and these rules have to change with it.
 */

/**
 * Letters, digits and marks are what words are made of, and the analyzer also keeps an underscore
 * inside a word: "snake_case_name" is indexed as one word. Every other character is a gap between
 * words, apart from the cases `keepInsideWord` handles.
 */
const notPartOfWord = /[^\p{L}\p{N}\p{M}_\s]/gu;

/**
 * The analyzer indexes every Chinese or Japanese ideograph and every hiragana character as a word
 * of its own, so "東京" is indexed as "東" and "京". Katakana and Korean words are kept whole.
 */
const indexedOneCharacterAtATime = /[\p{Script=Han}\p{Script=Hiragana}]/gu;

const isLetter = (character: string | undefined) => !!character && /[\p{L}\p{M}]/u.test(character);
const isDigit = (character: string | undefined) => !!character && /\p{N}/u.test(character);

/**
 * The analyzer keeps some punctuation inside a word when it has the right characters on both sides:
 * - a dot or an apostrophe, straight or curly, between two letters or between two digits, so
 *   "node.js", "1.5", "rock'n'roll" and "O’Reilly" are each one word, while "abc.123" and "90's"
 *   are split,
 * - a colon between two letters, so "Roadtest:Best" is one word, while "3:2" is split,
 * - a comma or a semicolon between two digits, so "1,000" is one word.
 * The colon is special in the query string syntax, so it is escaped. Anywhere else these split
 * words like any other punctuation.
 */
const keepInsideWord = (character: string, before?: string, after?: string): string | null => {
    const betweenLetters = isLetter(before) && isLetter(after);
    const betweenDigits = isDigit(before) && isDigit(after);
    if (".'\u2018\u2019".includes(character) && (betweenLetters || betweenDigits)) {
        return character;
    }
    if (character === ":" && betweenLetters) {
        return "\\:";
    }
    if ((character === "," || character === ";") && betweenDigits) {
        return character;
    }
    return null;
};

export const normalizeValue = (value: string) => {
    if (!value) {
        return "";
    }

    const result = value
        .replace(indexedOneCharacterAtATime, character => ` ${character} `)
        .replace(notPartOfWord, (character, offset: number, text: string) => {
            return keepInsideWord(character, text[offset - 1], text[offset + 1]) ?? " ";
        })
        .replace(/\s+/g, " ")
        .trim();

    /**
     * The query string syntax reads uppercase AND, OR and NOT as operators, so "Terms AND/OR
     * conditions" would fail to parse and "Rock/NOT/Roll" would exclude "Roll". The analyzer
     * lowercases indexed words anyway, so lowercasing them makes them plain words to search for.
     */
    return result.replace(/\b(AND|OR|NOT)\b/g, operator => operator.toLowerCase());
};

/**
 * The wildcards let the first and the last word match while the user is still typing them, so
 * "Best Ca" finds "Best Cars". The words in between have to match whole words.
 */
export const normalizeValueWithAsterisk = (initial: string) => {
    const value = normalizeValue(initial);
    if (!value) {
        return value;
    }
    return `*${value}*`;
};
