import { useCallback, useState, useEffect } from "react";
import isEmpty from "lodash/isEmpty";
import { useNavigate } from "@webiny/react-router";
import get from "lodash/get";
import pick from "lodash/pick";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useCurrentApp } from "./useLocationSearch";
import {
    GET_WORKFLOW_QUERY,
    CREATE_WORKFLOW_MUTATION,
    LIST_WORKFLOWS_QUERY,
    UPDATE_WORKFLOW_MUTATION,
    GetWorkflowQueryResponse,
    GetWorkflowQueryVariables,
    CreateWorkflowMutationResponse,
    CreateWorkflowMutationVariables,
    UpdateWorkflowMutationResponse,
    UpdateWorkflowMutationVariables
} from "~/graphql/workflow.gql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import { ApwWorkflowScopeTypes } from "~/types";
import { getNanoid } from "~/utils";
import { useQuery as useRouterQuery } from "~/hooks/useQuery";

const t = i18n.ns("app-apw/admin/publishing-workflows/form");

const initialStepData = {
    title: "",
    type: "",
    reviewers: []
};

export const getInitialStepData = () => ({
    ...initialStepData,
    id: getNanoid()
});

const newFormData = {
    title: "Untitled",
    steps: [getInitialStepData()],
    scope: {
        type: ApwWorkflowScopeTypes.PB,
        data: {
            pages: [],
            categories: [],
            entries: [],
            models: []
        }
    }
};

const CREATE_MUTATION_FIELDS = ["title", "steps", "scope", "app"];
const UPDATE_MUTATION_FIELDS = ["title", "steps", "scope"];

const BASE_URL = "/apw/publishing-workflows";

export type UsePublishingWorkflowFormHook = {
    (): {
        workflow: Record<string, any>;
        loading: boolean;
        showEmptyView: boolean;
        createPublishingWorkflow: () => void;
        cancelEditing: () => void;
        onSubmit: (formData: any) => Promise<void>;
        isDirty: boolean;
        setIsDirty: (value: boolean) => void;
    };
};

export const usePublishingWorkflowForm: UsePublishingWorkflowFormHook = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const query = useRouterQuery();
    const currentWorkflowId = query.get("id");

    /**
     * Reset "isDirty" flag whenever "currentWorkflowId" changes.
     */
    useEffect(() => {
        if (isDirty) {
            setIsDirty(false);
        }
    }, [currentWorkflowId]);

    const newEntry = query.get("new") === "true";

    const app = useCurrentApp();

    const getQuery = useQuery<GetWorkflowQueryResponse, GetWorkflowQueryVariables>(
        GET_WORKFLOW_QUERY,
        {
            variables: { id: currentWorkflowId as string },
            skip: !currentWorkflowId,
            onCompleted: data => {
                const error = get(data, "apw.getWorkflow.error");
                if (error) {
                    navigate(BASE_URL);
                    showSnackbar(error.message);
                }
            }
        }
    );

    const [create, createMutation] = useMutation<
        CreateWorkflowMutationResponse,
        CreateWorkflowMutationVariables
    >(CREATE_WORKFLOW_MUTATION, {
        refetchQueries: [{ query: LIST_WORKFLOWS_QUERY }]
    });

    const [update, updateMutation] = useMutation<
        UpdateWorkflowMutationResponse,
        UpdateWorkflowMutationVariables
    >(UPDATE_WORKFLOW_MUTATION, {
        refetchQueries: [{ query: LIST_WORKFLOWS_QUERY }]
    });

    const loading = [getQuery, createMutation, updateMutation].some(item => item.loading);

    const onSubmit = useCallback(
        async formData => {
            /**
             * Add "app" variable.
             */
            const data = { ...formData, app };

            const isUpdate = data.createdOn;

            let response;
            if (isUpdate) {
                response = await update({
                    variables: { id: data.id, data: pick(data, UPDATE_MUTATION_FIELDS) }
                });
            } else {
                response = await create({
                    variables: { data: pick(data, CREATE_MUTATION_FIELDS) }
                });
            }

            const error = get(response, "data.apw.workflow.error");
            if (error) {
                return showSnackbar(error.message);
            }
            const workflowData = get(response, "data.apw.workflow.data");

            if (!isUpdate) {
                navigate(`${BASE_URL}?id=${encodeURIComponent(workflowData.id)}&app=${app}`);
            }

            showSnackbar(t`Workflow saved successfully.`);
        },
        [currentWorkflowId, app]
    );

    const workflow = getQuery.data ? getQuery.data.apw.getWorkflow.data : {};

    const showEmptyView = !newEntry && !loading && isEmpty(workflow);

    const createPublishingWorkflow = useCallback(() => navigate(BASE_URL + "?new=true"), []);

    const cancelEditing = useCallback(() => navigate(BASE_URL), []);

    return {
        workflow: isEmpty(workflow) ? newFormData : workflow,
        loading,
        showEmptyView,
        createPublishingWorkflow,
        cancelEditing,
        onSubmit,
        isDirty,
        setIsDirty
    };
};
