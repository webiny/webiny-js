import * as React from "react";
import { css } from "emotion";
import { ContentModelForm } from "@webiny/app-headless-cms/admin/components/ContentModelForm";
import useReactRouter from "use-react-router";
import {
    createCreateFromMutation,
    createCreateMutation,
    createUpdateMutation
} from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";
import { useCallback, useMemo } from "react";
import get from "lodash.get";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

const pageInnerWrapper = css({
    overflowY: "scroll",
    overflowX: "hidden",
    height: "calc(100vh - 230px)",
    position: "relative",
    ".webiny-pb-page-document": {
        transform: "scale(var(--webiny-pb-page-preview-scale))",
        transition: "transform 0.5s ease-in-out",
        transformOrigin: "top center"
    }
});

const ContentForm = ({ contentModel, content, dataList, getLocale, setLoading, getLoading }) => {
    const query = new URLSearchParams(location.search);
    const { history } = useReactRouter();
    const { showSnackbar } = useSnackbar();

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
            setLoading(true);
            const response = await createMutation({
                variables: { data }
            });
            setLoading(false);

            if (response.data.content.error) {
                return showSnackbar(response.data.content.message);
            }

            const { id } = response.data.content.data;
            query.set("id", id);
            history.push({ search: query.toString() });
            dataList.refresh();
        },
        [contentModel.modelId]
    );

    const updateContent = useCallback(
        async (id, data) => {
            setLoading(true);
            const response = await updateMutation({
                variables: { id, data }
            });
            setLoading(false);

            if (response.data.content.error) {
                return showSnackbar(response.data.content.message);
            }

            showSnackbar("Content saved successfully.");
        },
        [contentModel.modelId]
    );

    const createContentFrom = useCallback(
        async (id, data) => {
            setLoading(true);
            const response = await createFromMutation({
                variables: { revision: id, data }
            });
            setLoading(false);

            if (response.data.content.error) {
                return showSnackbar(response.data.content.message);
            }

            showSnackbar("A new revision was created.");
            const { id: revisionId } = response.data.content.data;
            query.set("id", revisionId);
            history.push({ search: query.toString() });
            dataList.refresh();
        },
        [contentModel.modelId]
    );

    return (
        <div className={pageInnerWrapper}>
            <ContentModelForm
                locale={getLocale()}
                loading={getLoading()}
                contentModel={contentModel}
                content={content}
                onSubmit={async data => {
                    if (content.id) {
                        if (get(content, "meta.locked")) {
                            await createContentFrom(content.id, data);
                            return;
                        }
                        await updateContent(content.id, data);
                        return;
                    }

                    await createContent(data);
                }}
            />
        </div>
    );
};

export default ContentForm;
