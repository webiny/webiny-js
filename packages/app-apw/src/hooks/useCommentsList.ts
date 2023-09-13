import dotPropImmutable from "dot-prop-immutable";
import { useQuery } from "@apollo/react-hooks";
import {
    LIST_COMMENTS_QUERY,
    ListCommentsQueryResponse,
    ListCommentsQueryVariables
} from "~/graphql/comment.gql";
import { ApwComment } from "~/types";
import { useCurrentChangeRequestId } from "~/hooks/useCurrentChangeRequestId";
import { useEffect, useState } from "react";
import { NetworkStatus } from "apollo-client";

interface UseCommentsListResult {
    loading: boolean;
    comments: Array<ApwComment>;
    refetch: () => Promise<any>;
    /*
     * Detects the initial data loading. Value is 'true' when the data is loaded from the first request.
     * */
    initialDataLoaded: boolean;
}

/**
 * We're rendering latest comments at the end of the list in the UI.
 */
export const DEFAULT_SORT = ["createdOn_ASC"];
/**
 * Let's hope we don't have more than 1000 comments!
 *
 * We're using this hard coded value for limit because we are not implementing pagination for comments to keep things simple.
 */
export const ONE_THOUSAND = 1000;

export const useListCommentsVariables = () => {
    const changeRequestId = useCurrentChangeRequestId();

    return {
        sort: DEFAULT_SORT,
        limit: ONE_THOUSAND,
        where: {
            changeRequest: {
                id: changeRequestId
            }
        }
    };
};

export const useCommentsList = (): UseCommentsListResult => {
    const variables = useListCommentsVariables();
    const [initialDataLoaded, setInitialDataLoaded] = useState(false);

    const { data, loading, refetch, networkStatus } = useQuery<
        ListCommentsQueryResponse,
        ListCommentsQueryVariables
    >(LIST_COMMENTS_QUERY, {
        variables
    });

    useEffect(() => {
        if (!loading) {
            setInitialDataLoaded(() => true);
        }
        return () => {
            setInitialDataLoaded(() => false);
        };
    }, [!initialDataLoaded && networkStatus === NetworkStatus.ready]);

    const comments = dotPropImmutable.get(data, "apw.listComments.data", []);

    return {
        comments,
        loading,
        refetch,
        initialDataLoaded
    };
};
