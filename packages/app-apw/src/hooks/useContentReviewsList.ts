import { useCallback, useState, useMemo, useEffect } from "react";
import debounce from "lodash/debounce";
import { useNavigate } from "@webiny/react-router";
import { useQuery } from "@apollo/react-hooks";
import {
    LIST_CONTENT_REVIEWS_QUERY,
    ListContentReviewsQueryResponse,
    ListContentReviewsQueryVariables
} from "~/graphql/contentReview.gql";
import { ApwContentReview, ApwContentReviewListItem, ApwContentReviewStatus } from "~/types";

const BASE_URL = "/apw/content-reviews";

const serializeSorters = (data: any) => {
    if (!data) {
        return data;
    }
    const [[key, value]] = Object.entries(data);
    return `${key}:${value}`;
};

interface Config {
    sorters: { label: string; value: string }[];
}

interface UseContentReviewsListHook {
    (config: Config): {
        loading: boolean;
        contentReviews: Array<ApwContentReview>;
        filter: string;
        setFilter: (filter: string) => void;
        sort: string | null;
        setSort: (sort: string) => void;
        serializeSorters: (data: Record<string, string>) => string;
        editContentReview: (item: ApwContentReviewListItem) => void;
        status: ApwContentReviewStatus | "all";
        setStatus: (status: ApwContentReviewStatus | "all") => void;
    };
}

export const useContentReviewsList: UseContentReviewsListHook = (config: Config) => {
    const defaultSorter = config.sorters.length ? config.sorters[0].value : null;
    const [filter, setFilter] = useState<string>("");
    const [title, setTitle] = useState<string>("");
    const [sort, setSort] = useState<string | null>(defaultSorter);
    const [status, setStatus] = useState<ApwContentReviewStatus | "all">("all");
    const navigate = useNavigate();

    const performSearch = useMemo(() => {
        return debounce(value => setTitle(value), 250);
    }, []);
    /**
     * Perform debounced search whenever "filter" changes.
     */
    useEffect(() => {
        performSearch(filter);
    }, [filter]);

    const where = {
        status: status === "all" ? undefined : status,
        title_contains: title ? title : undefined
    };

    const { data, loading } = useQuery<
        ListContentReviewsQueryResponse,
        ListContentReviewsQueryVariables
    >(LIST_CONTENT_REVIEWS_QUERY, {
        variables: {
            where: where,
            sort: [sort as string]
        },
        /**
         * We're using "network-only" fetchPolicy here because, we need to update the cache result for this query after creating a content review,
         * for which we need to sync the variables, which is a lot of efforts at this stage.
         */
        fetchPolicy: "network-only"
    });

    const contentReviews = data ? data.apw.listContentReviews.data : [];

    const editContentReview = useCallback((item: ApwContentReviewListItem) => {
        const base = `${BASE_URL}/${encodeURIComponent(item.id)}`;
        const url = item.activeStep ? `${base}/${item.activeStep.id}` : base;
        navigate(url);
    }, []);

    return {
        contentReviews,
        loading,
        filter,
        setFilter,
        sort,
        setSort,
        serializeSorters,
        editContentReview,
        status,
        setStatus
    };
};
