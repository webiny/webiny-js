import React, { useCallback, useMemo } from "react";
import get from "lodash/get";
import cloneDeep from "lodash/cloneDeep";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";
import { ContentModelForm } from "../../../views/components/ContentModelForm";
import * as GQL from "../../../views/components/ContentModelForm/graphql";

const ContentForm = ({ contentModel, entry, setLoading, getLoading, setState }) => {
    console.log("form entry", entry);
    const query = new URLSearchParams(location.search);
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const { CREATE_CONTENT, UPDATE_CONTENT, CREATE_CONTENT_FROM, LIST_CONTENT } = useMemo(() => {
        return {
            LIST_CONTENT: GQL.createListQuery(contentModel),
            CREATE_CONTENT: GQL.createCreateMutation(contentModel),
            UPDATE_CONTENT: GQL.createUpdateMutation(contentModel),
            CREATE_CONTENT_FROM: GQL.createCreateFromMutation(contentModel)
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

            showSnackbar(`${contentModel.name} entry created successfully!`);
            const { id } = response.data.content.data;
            query.set("id", id);
            history.push({ search: query.toString() });
            return response;
        },
        [contentModel.modelId]
    );

    const updateContent = useCallback(
        async (revision, data) => {
            setLoading(true);
            const response = await updateMutation({
                variables: { revision, data }
            });
            setLoading(false);

            const { error } = response.data.content;
            if (error) {
                return showSnackbar(error.message);
            }

            showSnackbar("Content saved successfully.");
            return response;
        },
        [contentModel.modelId]
    );

    const createContentFrom = useCallback(
        async (revision, data) => {
            setLoading(true);
            const response = await createFromMutation({
                variables: { revision, data },
                update(cache, response) {
                    if (response.data.content.error) {
                        return;
                    }

                    const data = cloneDeep(
                        cache.readQuery<any>({ query: LIST_CONTENT })
                    );
                    const previousItemIndex = data.content.data.findIndex(
                        item => item.id === revision
                    );
                    data.content.data.splice(previousItemIndex, 1, response.data.content.data);
                    cache.writeQuery({ query: LIST_CONTENT, data });
                }
            });
            setLoading(false);

            const { data: newRevision, error } = response.data.content;
            if (error) {
                return showSnackbar(error.message);
            }
            
            // TODO: update list cache

            showSnackbar("A new revision was created!");
            query.set("id", newRevision.id);
            history.push({ search: query.toString() });

            return response;
        },
        [contentModel.modelId]
    );

    return (
        <ContentModelForm
            loading={getLoading()}
            contentModel={contentModel}
            entry={entry}
            onForm={contentForm => setState({ contentForm })}
            onSubmit={async data => {
                if (entry.id) {
                    if (get(entry, "meta.locked")) {
                        return createContentFrom(entry.id, data);
                    }
                    return updateContent(entry.id, data);
                }
                return createContent(data);
            }}
        />
    );
};

export default ContentForm;
