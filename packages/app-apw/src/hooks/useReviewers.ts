import { useQuery } from "@apollo/react-hooks";
import {
    LIST_REVIEWS_QUERY,
    ListReviewersQueryResponse,
    ListReviewersQueryVariables
} from "~/graphql/reviewer.gql";
import { ApwReviewer } from "~/types";

interface UseReviewersResult {
    reviewers: ApwReviewer[];
    loading: boolean;
}

export const useReviewers = (): UseReviewersResult => {
    const { data, loading } = useQuery<ListReviewersQueryResponse, ListReviewersQueryVariables>(
        LIST_REVIEWS_QUERY
    );

    return {
        reviewers: data ? data.apw.listReviewers.data : [],
        loading
    };
};
