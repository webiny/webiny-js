import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import { LIST_REVIEWS_QUERY } from "~/graphql/reviewer.gql";
import { ApwReviewer } from "~/types";

interface UseReviewersResult {
    reviewers: ApwReviewer[];
    loading: boolean;
}

export const useReviewers = (): UseReviewersResult => {
    const { data, loading } = useQuery(LIST_REVIEWS_QUERY);

    return {
        reviewers: get(data, "apw.listReviewers.data", []),
        loading
    };
};
