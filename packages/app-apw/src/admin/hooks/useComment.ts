import get from "lodash/get";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin";
import { ApwComment } from "~/types";
import { DEFAULT_SORT } from "~/admin/hooks/useCommentsList";
import {
    CREATE_COMMENT_MUTATION,
    DELETE_COMMENT_MUTATION,
    LIST_COMMENTS_QUERY,
    GET_COMMENT_QUERY
} from "../graphql/comment.gql";

interface UseCommentResult {
    createComment: Function;
    deleteComment: (id: string) => Promise<any>;
    comment: ApwComment;
    loading: boolean;
}

export const useComment = (id?: string): UseCommentResult => {
    const { showSnackbar } = useSnackbar();

    const { data, loading } = useQuery(GET_COMMENT_QUERY, {
        variables: { id },
        skip: !id
    });

    const comment = get(data, "apw.getComment.data");

    const [createComment] = useMutation(CREATE_COMMENT_MUTATION, {
        refetchQueries: [{ query: LIST_COMMENTS_QUERY, variables: { sort: DEFAULT_SORT } }],
        onCompleted: response => {
            const error = get(response, "apw.comment.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
        }
    });

    const [deleteComment] = useMutation(DELETE_COMMENT_MUTATION, {
        refetchQueries: [{ query: LIST_COMMENTS_QUERY, variables: { DEFAULT_SORT } }],
        onCompleted: response => {
            console.log(JSON.stringify({ response }, null, 2));
            const error = get(response, "apw.deleteComment.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
            showSnackbar("Comment deleted successfully!");
        }
    });

    return {
        comment,
        loading,
        createComment,
        deleteComment: async id => deleteComment({ variables: { id } })
    };
};
