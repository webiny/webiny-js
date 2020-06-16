import * as React from "react";
import { ContentModelForm } from "@webiny/app-headless-cms/admin/components/ContentModelForm";
import { useRouter } from "@webiny/react-router";
import {
    createCreateFromMutation,
    createCreateMutation,
    createListQuery,
    createUpdateMutation
} from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";
import { useCallback, useMemo } from "react";
import get from "lodash/get";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import cloneDeep from "lodash/cloneDeep";

const ContentForm = ({ contentModel, content, getLocale, setLoading, getLoading, setState }) => {
    const query = new URLSearchParams(location.search);
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const { CREATE_CONTENT, UPDATE_CONTENT, CREATE_CONTENT_FROM, LIST_CONTENT } = useMemo(() => {
        return {
            LIST_CONTENT: createListQuery(contentModel),
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
                variables: { data },
                update(cache, response) {
                    if (response.data.content.error) {
                        return;
                    }

                    // Prepend the newly created item to the content list.
                    const data = cloneDeep(
                        cache.readQuery<any>({
                            query: LIST_CONTENT
                        })
                    );
                    data.content.data = [response.data.content.data, ...data.content.data];
                    cache.writeQuery({ query: LIST_CONTENT, data: data });
                }
            });
            setLoading(false);

            if (response.data.content.error) {
                return showSnackbar(response.data.content.message);
            }

            showSnackbar("Content created successfully.");
            const { id } = response.data.content.data;
            query.set("id", id);
            history.push({ search: query.toString() });
            return response;
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
                variables: { revision: id, data },
                update(cache, response) {
                    if (response.data.content.error) {
                        return;
                    }

                    const data = cloneDeep(
                        cache.readQuery<any>({ query: LIST_CONTENT })
                    );
                    const previousItemIndex = data.content.data.findIndex(item => item.id === id);
                    data.content.data.splice(previousItemIndex, 1, response.data.content.data);
                    cache.writeQuery({ query: LIST_CONTENT, data });
                }
            });
            setLoading(false);

            if (response.data.content.error) {
                return showSnackbar(response.data.content.message);
            }

            showSnackbar("A new revision was created.");
            const { id: revisionId } = response.data.content.data;
            query.set("id", revisionId);
            history.push({ search: query.toString() });
        },
        [contentModel.modelId]
    );

    return (
        <ContentModelForm
            locale={getLocale()}
            loading={getLoading()}
            contentModel={contentModel}
            content={content}
            onForm={contentForm => setState({ contentForm })}
            onSubmit={async data => {
                if (content.id) {
                    if (get(content, "meta.locked")) {
                        await createContentFrom(content.id, data);
                        return;
                    }
                    await updateContent(content.id, data);
                    return;
                }
                return await createContent(data);
            }}
        />
    );
};

export default ContentForm;
