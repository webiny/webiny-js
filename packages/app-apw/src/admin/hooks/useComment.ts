import get from "lodash/get";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin";
import { ApwComment } from "~/types";
import { useListCommentsVariables } from "~/admin/hooks/useCommentsList";
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

    const listCommentsVariables = useListCommentsVariables();

    const [createComment] = useMutation(CREATE_COMMENT_MUTATION, {
        refetchQueries: [{ query: LIST_COMMENTS_QUERY, variables: listCommentsVariables }],
        onCompleted: response => {
            const error = get(response, "apw.comment.error");
            if (error) {
                showSnackbar(error.message);
                return;
            }
        }
    });

    const [deleteComment] = useMutation(DELETE_COMMENT_MUTATION, {
        refetchQueries: [{ query: LIST_COMMENTS_QUERY, variables: listCommentsVariables }],
        onCompleted: response => {
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
