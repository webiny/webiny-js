import { useCallback } from "react";
import isEmpty from "lodash/isEmpty";
import { useRouter } from "@webiny/react-router";
import get from "lodash/get";
import pick from "lodash/pick";
import omit from "lodash/omit";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useCurrentWorkflowId } from "./useLocationSearch";
import {
    GET_WORKFLOW_QUERY,
    CREATE_WORKFLOW_MUTATION,
    LIST_WORKFLOWS_QUERY,
    UPDATE_WORKFLOW_MUTATION
} from "./graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-apw/admin/publishing-workflows/form");

export const usePublishingWorkflowForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const newEntry = new URLSearchParams(location.search).get("new") === "true";
    const currentWorkflowId = useCurrentWorkflowId();

    const getQuery = useQuery(GET_WORKFLOW_QUERY, {
        variables: { id: currentWorkflowId },
        skip: !currentWorkflowId,
        onCompleted: data => {
            const error = get(data, "apw.getWorkflow.error");
            if (error) {
                history.push(baseUrl);
                showSnackbar(error.message);
            }
        }
    });

    const [create, createMutation] = useMutation(CREATE_WORKFLOW_MUTATION, {
        refetchQueries: [{ query: LIST_WORKFLOWS_QUERY }]
    });

    const [update, updateMutation] = useMutation(UPDATE_WORKFLOW_MUTATION, {
        refetchQueries: [{ query: LIST_WORKFLOWS_QUERY }]
    });

    const loading = [getQuery, createMutation, updateMutation].some(item => item.loading);

    const onSubmit = useCallback(
        async data => {
            const isUpdate = data.createdOn;
            const [operation, args] = isUpdate
                ? [update, { variables: { code: data.code, data: pick(data, "default") } }]
                : [create, { variables: { data: omit(data, ["createdOn"]) } }];

            const response = await operation(args);

            const error = get(response, "data.apw.workflow.error");
            if (error) {
                return showSnackbar(error.message);
            }

            !isUpdate && history.push(`${baseUrl}?id=${data.id}`);
            showSnackbar(t`Locale saved successfully.`);
        },
        [currentWorkflowId]
    );

    const workflow = get(getQuery, "data.apw.getWorkflow.data", {});

    const showEmptyView = !newEntry && !loading && isEmpty(workflow);
    const baseUrl = "/apw/publishing-workflows";
    const createPublishingWorkflow = useCallback(() => history.push(baseUrl + "?new=true"), []);
    const cancelEditing = useCallback(() => history.push(baseUrl), []);

    return {
        workflow,
        loading,
        showEmptyView,
        createPublishingWorkflow,
        cancelEditing,
        onSubmit
    };
};
