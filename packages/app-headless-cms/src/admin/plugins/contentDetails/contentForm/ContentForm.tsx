import React, { useCallback, useMemo } from "react";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";
import { ContentModelForm } from "../../../views/components/ContentModelForm";
import * as GQL from "../../../views/components/ContentModelForm/graphql";
import * as GQLCache from "../cache";

const ContentForm = ({ contentModel, entry, setLoading, getLoading, setState }) => {
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const goToRevision = useCallback(id => {
        history.push(`/cms/content-entries/${contentModel.modelId}?id=${encodeURIComponent(id)}`);
    }, []);

    const { CREATE_CONTENT, UPDATE_CONTENT, CREATE_CONTENT_FROM } = useMemo(() => {
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
                update(cache, { data }) {
                    const { data: entry, error } = data.content;
                    if (error) {
                        return;
                    }

                    GQLCache.addEntryToListCache(contentModel, cache, entry);
                }
            });
            setLoading(false);

            if (response.data.content.error) {
                showSnackbar(response.data.content.message);
                return null;
            }

            showSnackbar(`${contentModel.name} entry created successfully!`);
            const { data: entry } = response.data.content;
            goToRevision(entry.id);
            return entry;
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
                showSnackbar(error.message);
                return null;
            }

            showSnackbar("Content saved successfully.");
            const { data: entry } = response.data.content;
            return entry;
        },
        [contentModel.modelId]
    );

    const createContentFrom = useCallback(
        async (revision, formData) => {
            setLoading(true);
            const response = await createFromMutation({
                variables: { revision, data: formData },
                update(cache, { data }) {
                    const { data: newRevision, error } = data.content;
                    if (error) {
                        return;
                    }

                    GQLCache.updateLatestRevisionInListCache(contentModel, cache, newRevision);
                    GQLCache.addRevisionToRevisionsCache(contentModel, cache, newRevision);

                    showSnackbar("A new revision was created!");
                    history.push(
                        `/cms/content-entries/${contentModel.modelId}?id=${encodeURIComponent(
                            newRevision.id
                        )}`
                    );
                }
            });
            setLoading(false);

            const { data, error } = response.data.content;
            if (error) {
                showSnackbar(error.message);
                return null;
            }

            return data;
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
