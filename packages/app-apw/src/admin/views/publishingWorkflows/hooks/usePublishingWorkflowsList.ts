import { useCallback, useState } from "react";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { useQuery } from "@apollo/react-hooks";
import { useCurrentApp } from "./useCurrentApp";
import { LIST_WORKFLOWS_QUERY } from "./graphql";

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

interface UsePublishingWorkflowsListHook {
    (config: Config): {
        loading: boolean;
        workflows: Array<{
            id: string;
            title: string;
            createdOn: string;
            [key: string]: any;
        }>;
        currentLocaleCode: string;
        createPublishingWorkflow: (app: string) => void;
        filter: string;
        setFilter: (filter: string) => void;
        sort: string;
        setSort: (sort: string) => void;
        serializeSorters: (data: Record<string, string>) => string;
        editPublishingWorkflow: (code: string) => void;
        deletePublishingWorkflow: (code: string) => void;
    };
}

export const usePublishingWorkflowsList: UsePublishingWorkflowsListHook = (config: Config) => {
    const defaultSorter = config.sorters.length ? config.sorters[0].sorters : null;
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>(serializeSorters(defaultSorter));

    const { history } = useRouter();

    const currentLocaleCode = useCurrentApp();
    const listQuery = useQuery(LIST_WORKFLOWS_QUERY);

    const data = listQuery.loading ? [] : get(listQuery, "data.apw.listWorkflows.data");

    const loading = [listQuery].some(item => item.loading);

    const baseUrl = "/apw/publishing-workflows";

    const createPublishingWorkflow = useCallback(
        app => history.push(`${baseUrl}?new=true&app=${app}`),
        []
    );

    const editPublishingWorkflow = useCallback(code => {
        history.push(`${baseUrl}?code=${code}`);
    }, []);

    const deletePublishingWorkflow = useCallback(() => {
        console.log("Delete...");
    }, []);

    return {
        workflows: data,
        loading,
        currentLocaleCode,
        createPublishingWorkflow,
        filter,
        setFilter,
        sort,
        setSort,
        serializeSorters,
        editPublishingWorkflow,
        deletePublishingWorkflow
    };
};
