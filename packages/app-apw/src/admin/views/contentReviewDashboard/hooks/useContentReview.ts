import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import { GET_CONTENT_REVIEW_QUERY } from "./graphql";
import { ApwContentReview } from "~/types";

interface UseContentReviewParams {
    id: string;
}

interface UseContentReviewResult {
    contentReview: ApwContentReview;
    loading: boolean;
}

export function useContentReview(params: UseContentReviewParams): UseContentReviewResult {
    const id = decodeURIComponent(params.id);

    const { data, loading } = useQuery(GET_CONTENT_REVIEW_QUERY, {
        variables: { id },
        skip: !id
    });
    return {
        contentReview: get(data, "apw.getContentReview.data"),
        loading
    };
}
