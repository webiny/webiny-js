import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import { GET_COMMENT_QUERY } from "./graphql";
import { ApwComment } from "~/types";

interface UseCommentParams {
    id: string;
}

interface UseCommentResult {
    comment: ApwComment;
    loading: boolean;
}

export const useComment = ({ id }: UseCommentParams): UseCommentResult => {
    const { data, loading } = useQuery(GET_COMMENT_QUERY, { variables: { id } });

    return {
        comment: get(data, "apw.getComment.data"),
        loading
    };
};
