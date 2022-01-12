import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import pick from "lodash/pick";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { FormOnSubmit } from "@webiny/form";
import * as GQL from "~/admin/graphql/contentEntries";
import { useMutation } from "~/admin/hooks";
import * as GQLCache from "~/admin/views/contentEntries/ContentEntry/cache";
import { prepareFormData } from "~/admin/views/contentEntries/ContentEntry/prepareFormData";
import { CmsEditorContentModel, CmsEditorField, CmsEditorFieldRendererPlugin } from "~/types";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { plugins } from "@webiny/plugins";

/**
 * Used for some fields to convert their values.
 */
const convertDefaultValue = (field: CmsEditorField, value: any): string | number | boolean => {
    switch (field.type) {
        case "boolean":
            return Boolean(value);
        case "number":
            return Number(value);
        default:
            return value;
    }
};

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

    const getDefaultValues = (overrides: Record<string, any> = {}): Record<string, any> => {
        const values: Record<string, any> = {};
        /**
         * Assign the default values:
         * * check the settings.defaultValue
         * * check the predefinedValues for selected value
         */
        for (const field of contentModel.fields) {
            /**
             * When checking if defaultValue is set in settings, we do the undefined check because it can be null, 0, empty string, false, etc...
             */
            const { settings, multipleValues = false } = field;
            if (settings && settings.defaultValue !== undefined) {
                /**
                 * Special type of field is the boolean one.
                 * We MUST set true/false for default value.
                 */
                values[field.fieldId] = convertDefaultValue(field, settings.defaultValue);
                continue;
            }
            /**
             * No point in going further if predefined values are not enabled.
             */
            const { predefinedValues } = field;
            if (
                !predefinedValues ||
                !predefinedValues.enabled ||
                Array.isArray(predefinedValues.values) === false
            ) {
                continue;
            }
            /**
             * When field is not a multiple values one, we find the first possible default selected value and set it as field value.
             */
            if (!multipleValues) {
                const selectedValue = predefinedValues.values.find(({ selected }) => {
                    return !!selected;
                });
                if (selectedValue) {
                    values[field.fieldId] = convertDefaultValue(field, selectedValue.value);
                }
                continue;
            }
            /**
             *
             */
            values[field.fieldId] = predefinedValues.values
                .filter(({ selected }) => !!selected)
                .map(({ value }) => {
                    return convertDefaultValue(field, value);
                });
        }
        return { ...values, ...overrides };
    };

    return {
        /**
         * If entry is not set or entry.id does not exist, it means that form is for the new entry, so fetch default values.
         */
        data: entry && entry.id ? entry : getDefaultValues(),
        loading,
        setLoading,
        onChange: params.onChange,
        onSubmit,
        invalidFields,
        renderPlugins
    };
}
