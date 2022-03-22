import { useCallback, useState } from "react";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useCurrentWorkflowId } from "./useLocationSearch";
import { DELETE_WORKFLOW_MUTATION, LIST_WORKFLOWS_QUERY } from "./graphql";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-apw/admin/publishing-workflows/data-list");

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

interface UsePublishingWorkflowsListHook {
    (config: Config): {
        loading: boolean;
        workflows: Array<{
            id: string;
            title: string;
            createdOn: string;
            [key: string]: any;
        }>;
        currentWorkflowId: string | null;
        createPublishingWorkflow: (app: string) => void;
        filter: string;
        setFilter: (filter: string) => void;
        sort: string;
        setSort: (sort: string) => void;
        serializeSorters: (data: Record<string, string>) => string;
        editPublishingWorkflow: (id: string, app: string) => void;
        deletePublishingWorkflow: (id: string) => void;
    };
}

export const usePublishingWorkflowsList: UsePublishingWorkflowsListHook = (config: Config) => {
    const defaultSorter = config.sorters.length ? config.sorters[0].sorters : null;
    const [filter, setFilter] = useState<string>("");
    const [sort, setSort] = useState<string>(serializeSorters(defaultSorter));
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();

    const currentWorkflowId = useCurrentWorkflowId();
    const listQuery = useQuery(LIST_WORKFLOWS_QUERY);
    const [deleteWorkflow] = useMutation(DELETE_WORKFLOW_MUTATION, {
        refetchQueries: [{ query: LIST_WORKFLOWS_QUERY }]
    });

    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog"
    });

    const data = listQuery.loading ? [] : get(listQuery, "data.apw.listWorkflows.data");

    const loading = [listQuery].some(item => item.loading);

    const baseUrl = "/apw/publishing-workflows";

    const createPublishingWorkflow = useCallback(
        app => history.push(`${baseUrl}?new=true&app=${app}`),
        []
    );

    const editPublishingWorkflow = useCallback((id, app) => {
        history.push(`${baseUrl}?id=${encodeURIComponent(id)}&app=${app}`);
    }, []);

    const deletePublishingWorkflow = useCallback(
        id => {
            showConfirmation(async () => {
                const response = await deleteWorkflow({ variables: { id } });

                const error = get(response, "data.apw.deleteWorkflow.error");
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(t`Workflow "{id}" deleted.`({ id }));

                if (currentWorkflowId === id) {
                    history.push(baseUrl);
                }
            });
        },
        [currentWorkflowId]
    );

    return {
        workflows: data,
        loading,
        currentWorkflowId,
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
