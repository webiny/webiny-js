/**
 * Matches values that start with `value`, ignoring case: a prefix of the whole value, not of any
 * word in it ("gaming" does not match "Laptop for gaming"), as the other storages match.
 *
 * The prefix is matched on the value's `keyword` sub-field, which the index keeps only for strings
 * of up to 256 characters (`ignore_above`). A longer value has no `keyword` there, so it falls back
 * to `match_phrase_prefix` on the text, which matches at the start of any word. So does a field
 * mapped without a `keyword` sub-field.
 */
export const startsWithQuery = (basePath: string, value: string) => {
    const keywordPath = `${basePath}.keyword`;
    return {
        bool: {
            should: [
                {
                    prefix: {
                        [keywordPath]: {
                            value,
                            case_insensitive: true
                        }
                    }
                },
                {
                    bool: {
                        must: [{ match_phrase_prefix: { [basePath]: value } }],
                        must_not: [{ exists: { field: keywordPath } }]
                    }
                }
            ],
            minimum_should_match: 1
        }
    };
};
