import { useCallback, useState } from "react";
import orderBy from "lodash/orderBy";
import { useRouter } from "@webiny/react-router";

import { useCurrentApp } from "./useCurrentApp";

const serializeSorters = data => {
    if (!data) {
        return data;
    }
    const [[key, value]] = Object.entries(data);
    return `${key}:${value}`;
};

const deserializeSorters = (data: string): Record<string, "asc" | "desc" | boolean> => {
    if (typeof data !== "string") {
        return data;
    }

    const [key, value] = data.split(":") as [string, "asc" | "desc" | boolean];
    return {
        [key]: value
    };
};

interface Config {
    sorters: { label: string; sorters: Record<string, string> }[];
}

interface UsePublishingWorkflowsListHook {
    (config: Config): {
        loading: boolean;
        locales: Array<{
            code: string;
            default: boolean;
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

    const filterLocales = useCallback(
        ({ code }) => {
            return code.toLowerCase().includes(filter);
        },
        [filter]
    );

    const sortLocaleList = useCallback(
        locales => {
            if (!sort) {
                return locales;
            }
            const [[key, value]] = Object.entries(deserializeSorters(sort));
            return orderBy(locales, [key], [value]);
        },
        [sort]
    );

    const data = [];

    const loading = false;
    const filteredData = filter === "" ? data : data.filter(filterLocales);
    const locales = sortLocaleList(filteredData);
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
        locales,
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
