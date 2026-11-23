/**
 * Hex characters kept: 100 bytes of the title. Under OpenSearch's 255-character token limit and
 * the 256-character `keyword` limit, so the key stays one term; longer titles tie, which the list
 * cursor handles like any other tie.
 */
const MAX_KEY_LENGTH = 200;

/**
 * The storage-only title sort key of a review (B2 design 2): the trimmed, lower-cased title as hex
 * of its UTF-8 bytes. Pure. Hex keeps the key one token on OpenSearch, whose `_gte` / `_lte` on a
 * text field compare analyzed tokens, and compares the same everywhere (byte order is code point
 * order). `ReviewEntryMapper.toValues` writes it; the list cursor of a title sort resumes at it.
 * Never part of `ReviewData`.
 */
export const createReviewTitleSortKey = (title: string): string => {
    return Buffer.from(title.trim().toLocaleLowerCase(), "utf8")
        .toString("hex")
        .slice(0, MAX_KEY_LENGTH);
};
