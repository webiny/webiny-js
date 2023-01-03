import { BoolQueryConfig } from "@webiny/api-elasticsearch/types";

/**
 * This function will assign a minimum_should_match for the query if conditions are met:
 * * should is an array
 * * it is not empty
 * * minimum_should_match is not already set
 *
 *
 * By the default we set it to 1 as we want at least one OR condition to produce results.
 *
 * Users can modify minimum_should_match value via the body or query modification plugins.
 */
interface Params {
    query: BoolQueryConfig;
    value?: number;
}
export const assignMinimumShouldMatchToQuery = ({ query, value = 1 }: Params): void => {
    if (!Array.isArray(query.should)) {
        return;
    } else if (query.should.length === 0) {
        return;
    } else if (query.minimum_should_match) {
        return;
    }
    query.minimum_should_match = value > 0 ? value : 1;
};
