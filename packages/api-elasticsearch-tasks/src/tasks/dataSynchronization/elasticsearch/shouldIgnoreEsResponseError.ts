import WebinyError from "@webiny/error";

const IGNORED_ES_SEARCH_EXCEPTIONS = [
    "index_not_found_exception",
    "search_phase_execution_exception",
    "illegal_argument_exception"
];

export const shouldIgnoreEsResponseError = (error: WebinyError) => {
    return IGNORED_ES_SEARCH_EXCEPTIONS.includes(error.message);
};
