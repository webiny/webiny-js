import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import {
    GET_TARGET_DATA_MODEL,
    CREATE_TARGET_DATA_MODEL,
    UPDATE_TARGET_DATA_MODEL,
    LIST_TARGET_DATA_MODELS
} from "./graphql";

export const useTargetDataModelsForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const searchParams = new URLSearchParams(location.search);
    const currentTargetDataModelId = searchParams.get("id");

    const getQuery = useQuery(GET_TARGET_DATA_MODEL, {
        variables: { id: currentTargetDataModelId },
        skip: !currentTargetDataModelId,
        onCompleted: data => {
            const error = data?.targetDataModels?.getTarget_data_model?.error;
            if (error) {
                history.push("/target-data-models");
                showSnackbar(error.message);
            }
        }
    });

    const [create, createMutation] = useMutation(CREATE_TARGET_DATA_MODEL, {
        refetchQueries: [{ query: LIST_TARGET_DATA_MODELS }]
    });

    const [update, updateMutation] = useMutation(UPDATE_TARGET_DATA_MODEL, {
        refetchQueries: [{ query: LIST_TARGET_DATA_MODELS }]
    });

    const loading = [getQuery, createMutation, updateMutation].some(item => item.loading);

    const onSubmit = useCallback(
        async data => {
            const isUpdate = data.createdOn;
            const [operation, args] = isUpdate
                ? [update, { variables: { id: data.id, data } }]
                : [create, { variables: { data } }];

            const response = await operation(args);

            const error = response?.data?.targetDataModels?.target_data_model;
            if (error) {
                return showSnackbar(error.message);
            }

            !isUpdate && history.push(`/target-data-models?id=${data.id}`);
            showSnackbar("Target_data_model saved successfully.");
        },
        [currentTargetDataModelId]
    );

    // TODO: Use {} or null or just leave undefined?
    const target_data_model = getQuery?.data?.targetDataModels?.getTarget_data_model.data;

    // TODO: Check `showEmptyView`, can this be simplified?
    const emptyViewIsShown = !searchParams.get("new") && !loading && !target_data_model;
    const currentTargetDataModel = useCallback(() => history.push("/target-data-models?new"), []);
    const cancelEditing = useCallback(() => history.push("/target-data-models"), []);

    return {
        loading,
        emptyViewIsShown,
        currentTargetDataModel,
        cancelEditing,
        target_data_model,
        onSubmit
    };
};
