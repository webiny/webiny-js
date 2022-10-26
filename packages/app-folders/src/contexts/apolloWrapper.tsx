import { ApolloQueryResult } from "apollo-client/core/types";
import { FetchResult } from "apollo-link";

/**
 * A simple wrapper for Apollo fetching operations that handles the `loading` state as side effect.
 */
export const apolloFetchingWrapper = async (
    loadingHandler: () => void,
    apolloQuery: () => Promise<ApolloQueryResult<any> | FetchResult<any>>
) => {
    loadingHandler();

    const response = await apolloQuery();

    loadingHandler();

    return response;
};
