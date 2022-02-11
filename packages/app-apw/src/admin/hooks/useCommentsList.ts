import get from "lodash/get";
import { useQuery } from "@apollo/react-hooks";
import { LIST_COMMENTS_QUERY } from "../graphql/comment.gql";
import { ApwComment } from "~/types";

interface UseCommentsListResult {
    loading: boolean;
    comments: Array<ApwComment>;
}

export const DEFAULT_SORT = ["createdOn_ASC"];

export const useCommentsList = (): UseCommentsListResult => {
    const { data, loading } = useQuery(LIST_COMMENTS_QUERY, { variables: { sort: DEFAULT_SORT } });

    const comments = get(data, "apw.listComments.data", []);

    return {
        comments,
        loading
    };
};
