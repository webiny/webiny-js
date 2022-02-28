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

/**
 * Contains essential form functionality: data fetching, form submission, notifications, redirecting, and more.
 */

/**
 * Omits irrelevant values from the submitted form data (`id`, `createdOn`, `savedOn`, `createdBy`).
 * @param formData
 */
const getMutationData = (formData: Record<string, any>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdOn, savedOn, createdBy, ...data } = formData;
    return data;
};

export const useTargetDataModelsForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const searchParams = new URLSearchParams(location.search);
    const currentTargetDataModelId = searchParams.get("id");

    const getQuery = useQuery(GET_TARGET_DATA_MODEL, {
        variables: { id: currentTargetDataModelId },
        skip: !currentTargetDataModelId,
        onError: error => {
            history.push("/target-data-models");
            showSnackbar(error.message);
        }
    });

    const [create, createMutation] = useMutation(CREATE_TARGET_DATA_MODEL, {
        refetchQueries: [{ query: LIST_TARGET_DATA_MODELS }]
    });

    const [update, updateMutation] = useMutation(UPDATE_TARGET_DATA_MODEL);

    const loading = [getQuery, createMutation, updateMutation].some(item => item.loading);

    const onSubmit = useCallback(
        async formData => {
            const { id } = formData;
            const data = getMutationData(formData);
            const [operation, options] = id
                ? [update, { variables: { id, data } }]
                : [create, { variables: { data } }];

            try {
                const result = await operation(options);
                if (!id) {
                    const { id } = result.data.targetDataModels.createTargetDataModel;
                    history.push(`/target-data-models?id=${id}`);
                }

                showSnackbar("Target Data Model saved successfully.");
            } catch (e) {
                showSnackbar(e.message);
            }
        },
        [currentTargetDataModelId]
    );

    const targetDataModel = getQuery?.data?.targetDataModels?.getTargetDataModel;
    const emptyViewIsShown = !searchParams.has("new") && !loading && !targetDataModel;
    const currentTargetDataModel = useCallback(() => history.push("/target-data-models?new"), []);
    const cancelEditing = useCallback(() => history.push("/target-data-models"), []);

    return {
        loading,
        emptyViewIsShown,
        currentTargetDataModel,
        cancelEditing,
        targetDataModel,
        onSubmit
    };
};
