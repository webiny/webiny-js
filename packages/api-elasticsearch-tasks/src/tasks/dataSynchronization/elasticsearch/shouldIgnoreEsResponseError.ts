import type WebinyError from "@webiny/error";

const IGNORED_ES_SEARCH_EXCEPTIONS = [
    "index_not_found_exception",
    "search_phase_execution_exception",
    "illegal_argument_exception"
];

export const shouldIgnoreEsResponseError = (error: WebinyError) => {
    // The OpenSearch client reports these as the exception TYPE embedded in a longer message, e.g.
    // "search_phase_execution_exception: [query_shard_exception] Reason: No mapping found for
    // [id.keyword] ..." — which happens for indices the sync shouldn't touch (e.g. the security
    // plugin's security-auditlog index, which has no `id` field to sort on). Match by substring so
    // the listed exception types are actually recognized and such indices are skipped; an exact
    // equality check never matched the full message.
    const message = error?.message ?? "";
    return IGNORED_ES_SEARCH_EXCEPTIONS.some(type => message.includes(type));
};
