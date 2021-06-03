import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { GET_TARGET, CREATE_TARGET, UPDATE_TARGET, LIST_TARGETS } from "./graphql";

export const useTargetForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const searchParams = new URLSearchParams(location.search);
    const currentTargetId = searchParams.get("id");

    const getQuery = useQuery(GET_TARGET, {
        variables: { id: currentTargetId },
        skip: !currentTargetId,
        onCompleted: data => {
            const error = data?.targets?.getTarget?.error;
            if (error) {
                history.push("/targets");
                showSnackbar(error.message);
            }
        }
    });

    const [create, createMutation] = useMutation(CREATE_TARGET, {
        refetchQueries: [{ query: LIST_TARGETS }]
    });

    const [update, updateMutation] = useMutation(UPDATE_TARGET, {
        refetchQueries: [{ query: LIST_TARGETS }]
    });

    const loading = [getQuery, createMutation, updateMutation].some(item => item.loading);

    const onSubmit = useCallback(
        async data => {
            const isUpdate = data.createdOn;
            const [operation, args] = isUpdate
                ? [update, { variables: { id: data.id, data } }]
                : [create, { variables: { data } }];

            const response = await operation(args);

            const error = response?.data?.targets?.target;
            if (error) {
                return showSnackbar(error.message);
            }

            !isUpdate && history.push(`/targets?id=${data.id}`);
            showSnackbar("Target saved successfully.");
        },
        [currentTargetId]
    );

    // TODO: Use {} or null or just leave undefined?
    const target = getQuery?.data?.targets?.getTarget.data;

    // TODO: Check `showEmptyView`, can this be simplified?
    const emptyViewIsShown = !searchParams.get("new") && !loading && !target;
    const createTarget = useCallback(() => history.push("/targets?new"), []);
    const cancelEditing = useCallback(() => history.push("/targets"), []);

    return {
        loading,
        emptyViewIsShown,
        createTarget,
        cancelEditing,
        target,
        onSubmit
    };
};
