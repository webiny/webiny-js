import { useCallback, useState } from "react";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { useQuery } from "@apollo/react-hooks";
import { LIST_CONTENT_REVIEWS_QUERY } from "./graphql";

const serializeSorters = data => {
    if (!data) {
        return data;
    }
    const [[key, value]] = Object.entries(data);
    return `${key}:${value}`;
};

interface Config {
    sorters: { label: string; sorters: Record<string, string> }[];
}

interface UseContentReviewsListHook {
    (config: Config): {
        loading: boolean;
        contentReviews: Array<{
            id: string;
            title: string;
            createdOn: string;
            [key: string]: any;
        }>;
        filter: string;
        setFilter: (filter: string) => void;
        sort: string;
        setSort: (sort: string) => void;
        serializeSorters: (data: Record<string, string>) => string;
        editContentReview: (id: string) => void;
    };
}

export const useContentReviewsList: UseContentReviewsListHook = (config: Config) => {
    const defaultSorter = config.sorters.length ? config.sorters[0].sorters : null;
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>(serializeSorters(defaultSorter));
    const { history } = useRouter();

    const listQuery = useQuery(LIST_CONTENT_REVIEWS_QUERY);

    const data = listQuery.loading ? [] : get(listQuery, "data.apw.listContentReviews.data");

    const loading = [listQuery].some(item => item.loading);

    const baseUrl = "/apw/content-reviews";

    const editContentReview = useCallback((id: string) => {
        history.push(`${baseUrl}/${encodeURIComponent(id)}`);
    }, []);

    return {
        contentReviews: data,
        loading,
        filter,
        setFilter,
        sort,
        setSort,
        serializeSorters,
        editContentReview
    };
};
