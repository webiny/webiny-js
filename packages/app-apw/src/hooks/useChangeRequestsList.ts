import { useCallback, useState } from "react";
import { useNavigate } from "@webiny/react-router";
import { useQuery } from "@apollo/react-hooks";
import {
    LIST_CHANGE_REQUESTS_QUERY,
    ListChangeRequestsQueryResponse,
    ListChangeRequestsQueryVariables
} from "~/graphql/changeRequest.gql";
import { ApwChangeRequest } from "~/types";
import { useChangeRequestStep } from "./useChangeRequest";

const serializeSorters = (data: any) => {
    if (!data) {
        return data;
    }
    const [[key, value]] = Object.entries(data);
    return `${key}:${value}`;
};

const BASE_URL = "/apw/content-reviews";

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
    const navigate = useNavigate();
    const step = useChangeRequestStep();

    const variables = {
        where: {
            step
        }
    };

    const { data, loading } = useQuery<
        ListChangeRequestsQueryResponse,
        ListChangeRequestsQueryVariables
    >(LIST_CHANGE_REQUESTS_QUERY, {
        variables
    });

    const changeRequests = data ? data.apw.listChangeRequests.data : [];

    const editContentReview = useCallback((id: string) => {
        navigate(`${BASE_URL}/${encodeURIComponent(id)}`);
    }, []);

    return {
        changeRequests,
        loading,
        filter,
        setFilter,
        sort,
        setSort,
        serializeSorters,
        editContentReview
    };
};
