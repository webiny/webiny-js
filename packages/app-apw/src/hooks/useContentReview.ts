import { useQuery } from "@apollo/react-hooks";
import dotPropImmutable from "dot-prop-immutable";
import {
    GET_CONTENT_REVIEW_QUERY,
    GetContentReviewQueryResponse,
    GetContentReviewQueryVariables
} from "~/graphql/contentReview.gql";
import { ApwContentReview } from "~/types";
import { useContentReviewId } from "./useContentReviewId";
import { useEffect, useState } from "react";
import { NetworkStatus } from "apollo-client";

interface UseContentReviewParams {
    id: string;
}

interface UseContentReviewResult {
    contentReview: ApwContentReview;
    loading: boolean;
    refetch: () => Promise<any>;
    initialDataLoaded: boolean;
}

export function useContentReview(params: UseContentReviewParams): UseContentReviewResult {
    const id = decodeURIComponent(params.id);
    const [initialDataLoaded, setInitialDataLoaded] = useState(false);

    const { data, loading, refetch, networkStatus } = useQuery<
        GetContentReviewQueryResponse,
        GetContentReviewQueryVariables
    >(GET_CONTENT_REVIEW_QUERY, {
        variables: { id },
        skip: !id
    });

    useEffect(() => {
        if (!loading) {
            setInitialDataLoaded(() => true);
        }
        return () => {
            setInitialDataLoaded(() => false);
        };
    }, [!initialDataLoaded && networkStatus === NetworkStatus.ready]);

    return {
        contentReview: dotPropImmutable.get(data, "apw.getContentReview.data"),
        loading,
        refetch,
        initialDataLoaded
    };
}

export const useCurrentContentReview = (): UseContentReviewResult => {
    const { encodedId } = useContentReviewId() || { encodedId: "" };
    return useContentReview({ id: encodedId });
};
