import dotPropImmutable from "dot-prop-immutable";
import { useQuery } from "@apollo/react-hooks";
import {
    LIST_COMMENTS_QUERY,
    ListCommentsQueryResponse,
    ListCommentsQueryVariables
} from "~/graphql/comment.gql";
import { ApwComment } from "~/types";
import { useCurrentChangeRequestId } from "~/hooks/useCurrentChangeRequestId";

interface UseCommentsListResult {
    loading: boolean;
    comments: Array<ApwComment>;
    refetch: () => void;
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

    const { data, loading, refetch } = useQuery<
        ListCommentsQueryResponse,
        ListCommentsQueryVariables
    >(LIST_COMMENTS_QUERY, {
        variables,
        fetchPolicy: "cache-and-network"
    });

    const comments = dotPropImmutable.get(data, "apw.listComments.data", []);

    const refetchList = () => {
        if (refetch) {
            refetch({ ...variables }).catch(e => {
                // Do nothing.
                console.warn("Could not refetch the comments:");
                console.log(e);
            });
        }
    };

    return {
        comments,
        loading,
        refetch: refetchList
    };
};
