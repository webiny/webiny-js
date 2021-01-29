import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";
import { ContentModelForm } from "../../../views/components/ContentModelForm";
import * as GQL from "../../../views/components/ContentModelForm/graphql";
import * as GQLCache from "../cache";

const ContentForm = ({
    contentModel,
    entry,
    setLoading,
    getLoading,
    setState,
    listQueryVariables
}) => {
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

    const [invalidFields, setInvalidFields] = useState<Record<string, string>>({});

    const setInvalidFieldValues = errors => {
        const values = errors.reduce((acc, er) => {
            acc[er.fieldId] = er.error;
            return acc;
        }, {});
        setInvalidFields(() => values);
    };

    const resetInvalidFieldValues = () => {
        setInvalidFields(() => ({}));
    };

    const createContent = useCallback(
        async data => {
            setLoading(true);
            const response = await createMutation({
                variables: { data },
                update(cache, { data }) {
                    const { data: entry, error } = data.content;
                    if (error) {
                        showSnackbar(error.message);
                        setInvalidFieldValues(error.data);
                        return;
                    }
                    resetInvalidFieldValues();
                    GQLCache.addEntryToListCache(contentModel, cache, entry, listQueryVariables);
                }
            });
            setLoading(false);

            const { error, data: entry } = response.data.content;
            if (error) {
                showSnackbar(error.message);
                setInvalidFieldValues(error.data);
                return null;
            }
            resetInvalidFieldValues();
            showSnackbar(`${contentModel.name} entry created successfully!`);
            goToRevision(entry.id);
            return entry;
        },
        [contentModel.modelId, listQueryVariables]
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
                setInvalidFieldValues(error.data);
                return null;
            }

            resetInvalidFieldValues();
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
                        showSnackbar(error.message);
                        setInvalidFieldValues(error.data);
                        return;
                    }
                    resetInvalidFieldValues();
                    GQLCache.updateLatestRevisionInListCache(
                        contentModel,
                        cache,
                        newRevision,
                        listQueryVariables
                    );
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
                setInvalidFieldValues(error.data);
                return null;
            }
            resetInvalidFieldValues();

            return data;
        },
        [contentModel.modelId, listQueryVariables]
    );

    return (
        <ContentModelForm
            loading={getLoading()}
            contentModel={contentModel}
            entry={entry}
            onForm={contentForm => setState({ contentForm })}
            onSubmit={async data => {
                if (!entry.id) {
                    return createContent(data);
                }
                const { meta } = entry;
                const { locked: isLocked } = meta || {};
                if (!isLocked) {
                    return updateContent(entry.id, data);
                }
                return createContentFrom(entry.id, data);
            }}
            invalidFields={invalidFields}
        />
    );
};

export default ContentForm;
