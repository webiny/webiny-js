import { useCallback, useState } from "react";
import get from "lodash/get";
import { useNavigate } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useCurrentWorkflowId } from "./useLocationSearch";
import {
    DELETE_WORKFLOW_MUTATION,
    LIST_WORKFLOWS_QUERY,
    ListWorkflowQueryResponse,
    ListWorkflowQueryVariables,
    DeleteWorkflowMutationVariables,
    DeleteWorkflowMutationResponse
} from "~/graphql/workflow.gql";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import { ApwWorkflow } from "~/types";

const t = i18n.ns("app-apw/admin/publishing-workflows/data-list");

const serializeSorters = (data: any) => {
    if (!data) {
        return data;
    }
    const [[key, value]] = Object.entries(data);
    return `${key}:${value}`;
};

const BASE_URL = "/apw/publishing-workflows";

interface Config {
    sorters: { label: string; sorters: Record<string, string> }[];
}

interface UsePublishingWorkflowsListHook {
    (config: Config): {
        loading: boolean;
        workflows: Array<ApwWorkflow>;
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
    const navigate = useNavigate();

    const currentWorkflowId = useCurrentWorkflowId();
    const { data, loading } = useQuery<ListWorkflowQueryResponse, ListWorkflowQueryVariables>(
        LIST_WORKFLOWS_QUERY
    );
    const [deleteWorkflow] = useMutation<
        DeleteWorkflowMutationResponse,
        DeleteWorkflowMutationVariables
    >(DELETE_WORKFLOW_MUTATION, {
        refetchQueries: [{ query: LIST_WORKFLOWS_QUERY }]
    });

    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog"
    });

    const workflows = data ? data.apw.listWorkflows.data : [];

    const createPublishingWorkflow = useCallback(
        app => navigate(`${BASE_URL}?new=true&app=${app}`),
        []
    );

    const editPublishingWorkflow = useCallback((id, app) => {
        navigate(`${BASE_URL}?id=${encodeURIComponent(id)}&app=${app}`);
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
                    navigate(BASE_URL);
                }
            });
        },
        [currentWorkflowId]
    );

    return {
        workflows,
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
