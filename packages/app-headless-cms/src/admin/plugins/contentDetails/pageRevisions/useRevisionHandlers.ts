import { useCallback, useMemo } from "react";
import useReactRouter from "use-react-router";
import { usePublishRevisionHandler } from "../utils/usePublishRevisionHandler";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";

import {
    createCreateFromMutation,
    createCreateMutation,
    createUpdateMutation
} from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";

export function useRevisionHandlers({ content, contentModel, dataList }) {
    const { showSnackbar } = useSnackbar();
    const { history } = useReactRouter();
    const { publishRevision } = usePublishRevisionHandler({ content });

    const { CREATE_CONTENT, UPDATE_CONTENT, CREATE_CONTENT_FROM } = useMemo(() => {
        return {
            CREATE_CONTENT: createCreateMutation(contentModel),
            UPDATE_CONTENT: createUpdateMutation(contentModel),
            CREATE_CONTENT_FROM: createCreateFromMutation(contentModel)
        };
    }, [contentModel.modelId]);

    const [createMutation] = useMutation(CREATE_CONTENT);
    const [updateMutation] = useMutation(UPDATE_CONTENT);
    const [createFromMutation] = useMutation(CREATE_CONTENT_FROM);

    const createContent = useCallback(
        async data => {
            const response = await createMutation({
                variables: { data }
            });

            if (response.data.content.error) {
                showSnackbar(response.data.content.message);
            }

            const { id } = response.data.content.data;
            const query = new URLSearchParams(location.search);
            query.set("id", id);
            history.push({ search: query.toString() });
            dataList.refresh();
        },
        [contentModel.modelId]
    );

    const updateContent = useCallback(
        async (id, data) => {
            const response = await updateMutation({
                variables: { id, data }
            });

            if (response.data.content.error) {
                showSnackbar(response.data.content.message);
            }
        },
        [contentModel.modelId]
    );

    const deleteContent = useCallback(
        async (id, data) => {
            const response = await createFromMutation({
                variables: { revision: id, data }
            });

            if (response.data.content.error) {
                showSnackbar(response.data.content.message);
            }
        },
        [contentModel.modelId]
    );

    return {
        publishRevision,
        createContent,
        updateContent,
        deleteContent
    };
}
