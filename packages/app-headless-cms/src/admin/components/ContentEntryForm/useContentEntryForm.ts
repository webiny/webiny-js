import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import pick from "lodash/pick";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { FormOnSubmit } from "@webiny/form";
import {
    createCreateFromMutation,
    createCreateMutation,
    createUpdateMutation,
    CmsEntryCreateMutationResponse,
    CmsEntryCreateMutationVariables,
    CmsEntryUpdateMutationResponse,
    CmsEntryUpdateMutationVariables,
    CmsEntryCreateFromMutationResponse,
    CmsEntryCreateFromMutationVariables
} from "~/admin/graphql/contentEntries";
import { useMutation } from "~/admin/hooks";
import * as GQLCache from "~/admin/views/contentEntries/ContentEntry/cache";
import { prepareFormData } from "~/admin/views/contentEntries/ContentEntry/prepareFormData";
import {
    CmsEditorContentEntry,
    CmsEditorContentModel,
    CmsEditorField,
    CmsEditorFieldRendererPlugin
} from "~/types";
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

interface InvalidFieldError {
    fieldId: string;
    error: string;
}

interface UseContentEntryForm {
    data: Record<string, any>;
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    onChange: FormOnSubmit;
    onSubmit: FormOnSubmit;
    invalidFields: Record<string, string>;
    renderPlugins: CmsEditorFieldRendererPlugin[];
}

export interface UseContentEntryFormParams {
    contentModel: CmsEditorContentModel;
    entry: Partial<CmsEditorContentEntry>;
    onChange?: FormOnSubmit;
    onSubmit?: FormOnSubmit;
    addEntryToListCache: boolean;
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
            // LIST_CONTENT: createListQuery(contentModel),
            CREATE_CONTENT: createCreateMutation(contentModel),
            UPDATE_CONTENT: createUpdateMutation(contentModel),
            CREATE_CONTENT_FROM: createCreateFromMutation(contentModel)
        };
    }, [contentModel.modelId]);

    const [createMutation] = useMutation<
        CmsEntryCreateMutationResponse,
        CmsEntryCreateMutationVariables
    >(CREATE_CONTENT);
    const [updateMutation] = useMutation<
        CmsEntryUpdateMutationResponse,
        CmsEntryUpdateMutationVariables
    >(UPDATE_CONTENT);
    const [createFromMutation] = useMutation<
        CmsEntryCreateFromMutationResponse,
        CmsEntryCreateFromMutationVariables
    >(CREATE_CONTENT_FROM);

    /**
     * Note that when passing error.data variable we cast as InvalidFieldError[] because we know it is so.
     */
    const setInvalidFieldValues = (errors?: InvalidFieldError[]): void => {
        if (Array.isArray(errors) === false || !errors) {
            return;
        }
        const values = (errors || []).reduce((acc, er) => {
            acc[er.fieldId] = er.error;
            return acc;
        }, {} as Record<string, string>);
        setInvalidFields(() => values);
    };

    const resetInvalidFieldValues = (): void => {
        setInvalidFields(() => ({}));
    };

    const createContent = useCallback(
        async data => {
            setLoading(true);
            const response = await createMutation({
                variables: { data },
                update(cache, response) {
                    if (!response.data) {
                        showSnackbar("Missing response data in Create Entry.");
                        return;
                    }
                    const { data } = response;
                    const { data: entry, error } = data.content || {};
                    if (error) {
                        showSnackbar(error.message);
                        setInvalidFieldValues(error.data as InvalidFieldError[]);
                        return;
                    } else if (!entry) {
                        showSnackbar(
                            "Missing entry data in update callback on Create Entry Response."
                        );
                        return;
                    }
                    resetInvalidFieldValues();
                    if (params.addEntryToListCache) {
                        GQLCache.addEntryToListCache(
                            contentModel,
                            cache,
                            entry,
                            listQueryVariables
                        );
                    }
                }
            });
            setLoading(false);

            const { error, data: entry } = response.data?.content || {};
            if (error) {
                showSnackbar(error.message);
                setInvalidFieldValues(error.data as InvalidFieldError[]);
                return null;
            } else if (!entry) {
                showSnackbar("Missing entry data in Create Entry Response.");
                return null;
            }
            resetInvalidFieldValues();
            showSnackbar(`${contentModel.name} entry created successfully!`);
            if (typeof params.onSubmit === "function") {
                params.onSubmit(entry);
            } else {
                goToRevision(entry.id);
            }
            return entry;
        },
        [contentModel.modelId, listQueryVariables, params.onSubmit, params.addEntryToListCache]
    );

    const updateContent = useCallback(
        async (revision, data) => {
            setLoading(true);
            const response = await updateMutation({
                variables: { revision, data }
            });
            setLoading(false);
            if (!response.data) {
                showSnackbar("Missing response data on Update Entry Response.");
                return;
            }

            const { error } = response.data.content;
            if (error) {
                showSnackbar(error.message);
                setInvalidFieldValues(error.data as InvalidFieldError[]);
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
        async (revision: string, formData: Record<string, any>) => {
            setLoading(true);
            const response = await createFromMutation({
                variables: { revision, data: formData },
                update(cache, response) {
                    if (!response.data) {
                        showSnackbar(
                            "Missing data in update callback on Create From Entry Response."
                        );
                        return;
                    }
                    const { data: newRevision, error } = response.data.content;
                    if (error) {
                        showSnackbar(error.message);
                        setInvalidFieldValues(error.data as InvalidFieldError[]);
                        return;
                    } else if (!newRevision) {
                        showSnackbar("Missing entry data in update callback on Create From Entry.");
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
                    goToRevision(newRevision.id);
                }
            });
            setLoading(false);

            if (!response.data) {
                showSnackbar("Missing response data on Create From Entry Mutation.");
                return;
            }

            const { data, error } = response.data.content;
            if (error) {
                showSnackbar(error.message);
                setInvalidFieldValues(error.data as InvalidFieldError[]);
                return null;
            }
            resetInvalidFieldValues();

            return data;
        },
        [contentModel.modelId, listQueryVariables]
    );

    const onChange: FormOnSubmit = (data, form) => {
        if (!params.onChange) {
            return;
        }
        return params.onChange(data, form);
    };

    const onSubmit = async (data: Record<string, any>) => {
        const fieldsIds = contentModel.fields.map(item => item.fieldId);
        const formData = pick(data, [...fieldsIds]);

        const gqlData = prepareFormData(formData, contentModel.fields);
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

    const defaultValues = useMemo((): Record<string, any> => {
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
        return values;
    }, [contentModel.modelId]);

    return {
        /**
         * If entry is not set or entry.id does not exist, it means that form is for the new entry, so fetch default values.
         */
        data: entry && entry.id ? entry : defaultValues,
        loading,
        setLoading,
        onChange,
        onSubmit,
        invalidFields,
        renderPlugins
    };
}
