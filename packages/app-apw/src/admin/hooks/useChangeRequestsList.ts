import { useCallback, useState } from "react";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { useQuery } from "@apollo/react-hooks";
import { LIST_CHANGE_REQUESTS_QUERY } from "../graphql/changeRequest.gql";
import { ApwChangeRequest } from "~/types";
import { useChangeRequestStep } from "./useChangeRequest";

const serializeSorters = (data: any) => {
    if (!data) {
        return data;
    }
    const [[key, value]] = Object.entries(data);
    return `${key}:${value}`;
};

interface Config {
    sorters: { label: string; sorters: Record<string, string> }[];
}

interface UseChangeRequestsListHook {
    (config: Config): {
        loading: boolean;
        changeRequests: Array<ApwChangeRequest>;
        filter: string;
        setFilter: (filter: string) => void;
        sort: string;
        setSort: (sort: string) => void;
        serializeSorters: (data: Record<string, string>) => string;
        editContentReview: (id: string) => void;
    };
}

export const useChangeRequestsList: UseChangeRequestsListHook = (config: Config) => {
    const defaultSorter = config.sorters.length ? config.sorters[0].sorters : null;
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>(serializeSorters(defaultSorter));
    const { history } = useRouter();
    const step = useChangeRequestStep();

    const variables = {
        where: {
            step
        }
    };

    const listQuery = useQuery(LIST_CHANGE_REQUESTS_QUERY, {
        variables
    });

    const data = listQuery.loading ? [] : get(listQuery, "data.apw.listChangeRequests.data");

    const loading = [listQuery].some(item => item.loading);

    const baseUrl = "/apw/content-reviews";

    const editContentReview = useCallback((id: string) => {
        history.push(`${baseUrl}/${encodeURIComponent(id)}`);
    }, []);

    return {
        changeRequests: data,
        loading,
        filter,
        setFilter,
        sort,
        setSort,
        serializeSorters,
        editContentReview
    };
};
