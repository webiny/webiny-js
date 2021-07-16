import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import pick from "lodash/pick";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { FormOnSubmit } from "@webiny/form";
import * as GQL from "~/admin/graphql/contentEntries";
import { useMutation } from "~/admin/hooks";
import * as GQLCache from "~/admin/views/contentEntries/ContentEntry/cache";
import { prepareFormData } from "~/admin/views/contentEntries/ContentEntry/prepareFormData";
import { CmsEditorContentModel, CmsEditorFieldRendererPlugin } from "~/types";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { plugins } from "@webiny/plugins";

interface UseContentEntryForm {
    data: Record<string, any>;
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    onChange: FormOnSubmit;
    onSubmit: (data: Record<string, any>) => void;
    invalidFields: Record<string, string>;
    renderPlugins: CmsEditorFieldRendererPlugin[];
}

export interface UseContentEntryFormParams {
    contentModel: CmsEditorContentModel;
    entry?: { [key: string]: any };
    onChange?: FormOnSubmit;
    onSubmit?: FormOnSubmit;
}

export function useContentEntryForm(params: UseContentEntryFormParams): UseContentEntryForm {
    const { listQueryVariables } = useContentEntry();
    const { contentModel, entry } = params;
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const [invalidFields, setInvalidFields] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const renderPlugins = useMemo(
        () => plugins.byType<CmsEditorFieldRendererPlugin>("cms-editor-field-renderer"),
        []
    );

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

    const setInvalidFieldValues = errors => {
        const values = (errors || []).reduce((acc, er) => {
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

    const onSubmit = async data => {
        const fieldsIds = contentModel.fields.map(item => item.fieldId);
        const formData = pick(data, [...fieldsIds]);

        const gqlData = prepareFormData(formData, contentModel);
        if (!entry.id) {
            return createContent(gqlData);
        }

        const { meta } = entry;
        const { locked: isLocked } = meta || {};

        if (!isLocked) {
            return updateContent(entry.id, gqlData);
        }
        return createContentFrom(entry.id, gqlData);
    };

    const getDefaultValues = (overrides = {}) => {
        const values = {};
        // TODO: finish default values.
        /*fields.forEach(field => {
            const fieldId = field.fieldId;

            if (
                fieldId &&
                "defaultValue" in field.settings &&
                typeof field.settings.defaultValue !== "undefined"
            ) {
                values[fieldId] = field.settings.defaultValue;
            }
        });*/
        return { ...values, ...overrides };
    };

    return {
        data: entry ? entry : getDefaultValues(),
        loading,
        setLoading,
        onChange: params.onChange,
        onSubmit,
        invalidFields,
        renderPlugins
    };
}
