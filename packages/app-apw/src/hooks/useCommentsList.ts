import dotPropImmutable from "dot-prop-immutable";
import { useQuery } from "@apollo/react-hooks";
import {
    LIST_COMMENTS_QUERY,
    ListCommentsQueryResponse,
    ListCommentsQueryVariables
} from "~/graphql/comment.gql";
import { ApwComment } from "~/types";
import { useCurrentChangeRequestId } from "~/hooks/useCurrentChangeRequestId";
import { NetworkStatus } from "apollo-client";
import { useCallback, useEffect } from "react";

interface UseCommentsListResult {
    loading: boolean;
    comments: Array<ApwComment>;
    refetch: () => Promise<Record<string, any>> | null;
    networkStatus: NetworkStatus;
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

    useEffect(() => {
        console.log("useListCommentsVariables", changeRequestId);
    }, [changeRequestId]);

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

    useEffect(() => {
        console.log("useListCommentsVariables", variables.where.changeRequest.id);
    }, [variables]);

    const { data, loading, refetch, networkStatus } = useQuery<
        ListCommentsQueryResponse,
        ListCommentsQueryVariables
    >(LIST_COMMENTS_QUERY, {
        variables
    });

    const comments = dotPropImmutable.get(data, "apw.listComments.data", []);

    const refetchList = useCallback(() => {
        console.log("comments vars", variables.where.changeRequest.id);
        return refetch({ ...variables });
    }, [variables]);

    return {
        comments,
        loading,
        refetch: refetchList,
        networkStatus
    };
};
