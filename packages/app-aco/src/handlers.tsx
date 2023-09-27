import { Dispatch, SetStateAction } from "react";
import { ApolloQueryResult } from "apollo-client/core/types";
import { FetchResult } from "apollo-link";
import { Loading, LoadingActions } from "~/types";

/**
 * A simple wrapper for Apollo fetching operations that handles the `loading` state as side effect.
 *
 * @param loadingHandler: function that handle the loading state.
 * @param apolloQuery: Apollo Query or Mutation
 */
export const apolloFetchingHandler = async <ListSearchRecordsResponse = any,>(
    loadingHandler: (flag: boolean) => void,
    apolloQuery: () => Promise<
        ApolloQueryResult<ListSearchRecordsResponse> | FetchResult<ListSearchRecordsResponse>
    >
) => {
    loadingHandler(true);

    const response = await apolloQuery();
    loadingHandler(false);

    return response;
};

/**
 * A simple function to handle `loading` state.
 *
 * @param action: the `action` that has been performed.
 * @param setState: the logic to update the loading state.
 */
export const loadingHandler = (
    action: LoadingActions,
    setState?: Dispatch<SetStateAction<Loading<LoadingActions>>>
) => {
    return (flag: boolean) => {
        if (!setState) {
            return;
        }
        setState(state => {
            return {
                ...state,
                [action]: flag
            };
        });
    };
};

/**
 * A data loader wrapper that manages the loading state via a callback.
 * `loader` can be any function that returns a Promise.
 */
export async function dataLoader<T>(
    loadingHandler: (flag: boolean) => void,
    loader: () => Promise<T>
) {
    loadingHandler(true);

    return loader().finally(() => {
        loadingHandler(false);
    });
}
