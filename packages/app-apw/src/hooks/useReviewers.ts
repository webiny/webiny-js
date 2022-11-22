import { useQuery } from "@apollo/react-hooks";
import {
    LIST_REVIEWS_QUERY,
    ListReviewersQueryResponse,
    ListReviewersQueryVariables
} from "~/graphql/reviewer.gql";
import { ApwReviewer } from "~/types";
import dotPropImmutable from "dot-prop-immutable";
import { useMemo } from "react";

interface UseReviewersResult {
    reviewers: ApwReviewer[];
    loading: boolean;
}

export const useReviewers = (): UseReviewersResult => {
    const { data, loading } = useQuery<ListReviewersQueryResponse, ListReviewersQueryVariables>(
        LIST_REVIEWS_QUERY
    );

    const reviewers: ApwReviewer[] = useMemo(() => {
        if (!data) {
            return [];
        }
        return dotPropImmutable.get(data, "apw.listReviewers.data", []);
    }, [data]);

    return {
        reviewers,
        loading
    };
};
