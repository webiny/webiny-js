import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import pick from "lodash/pick";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { FormAPI, FormOnSubmit } from "@webiny/form";
import {
    CmsEntryCreateFromMutationResponse,
    CmsEntryCreateFromMutationVariables,
    CmsEntryCreateMutationResponse,
    CmsEntryCreateMutationVariables,
    CmsEntryUpdateMutationResponse,
    CmsEntryUpdateMutationVariables,
    createCreateFromMutation,
    createCreateMutation,
    createUpdateMutation,
    prepareFormData
} from "@webiny/app-headless-cms-common";
import { useCms, useModel, useMutation } from "~/admin/hooks";
import { CmsContentEntry, CmsModelField, CmsModelFieldRendererPlugin } from "~/types";
import { plugins } from "@webiny/plugins";
import { getFetchPolicy } from "~/utils/getFetchPolicy";
import { useNavigateFolder, useRecords } from "@webiny/app-aco";
import { ROOT_FOLDER } from "~/admin/constants";

/**
 * Used for some fields to convert their values.
 */
const convertDefaultValue = (field: CmsModelField, value: any): string | number | boolean => {
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
    onChange: FormOnSubmit<CmsContentEntry>;
    onSubmit: FormOnSubmit<CmsContentEntry>;
    invalidFields: Record<string, string>;
    renderPlugins: CmsModelFieldRendererPlugin[];
}

export interface UseContentEntryFormParams {
    entry: Partial<CmsContentEntry>;
    onChange?: FormOnSubmit<CmsContentEntry>;
    onSubmit?: FormOnSubmit<CmsContentEntry>;
    addEntryToListCache: boolean;
}

function useEntry(entryFromProps: Partial<CmsContentEntry>) {
    /**
     * We need to keep track of the entry locally
     */
    const [entry, setEntry] = useState(entryFromProps);
    const { onEntryRevisionPublish } = useCms();

    useEffect(() => {
        setEntry(entryFromProps);

        if (!entryFromProps.id) {
            return;
        }

        return onEntryRevisionPublish(next => async params => {
            const publishRes = await next(params);
            setEntry(entry => {
                return { ...entry, meta: publishRes?.entry?.meta || {} };
            });
            return publishRes;
        });
    }, [entryFromProps, entry.id]);

    return entry;
}

export function useContentEntryForm(params: UseContentEntryFormParams): UseContentEntryForm {
    const { model } = useModel();
    const { history, search: routerSearch } = useRouter();
    const [query] = routerSearch;
    const { currentFolderId } = useNavigateFolder();
    const { showSnackbar } = useSnackbar();
    const [invalidFields, setInvalidFields] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const entry = useEntry(params.entry);

    const { addRecordToCache, updateRecordInCache } = useRecords();

    const renderPlugins = useMemo(
        () => plugins.byType<CmsModelFieldRendererPlugin>("cms-editor-field-renderer"),
        []
    );

    const goToRevision = useCallback(
        (id: string) => {
            const fId = query.get("folderId");
            const folderId = fId ? `&folderId=${encodeURIComponent(fId)}` : "";
            history.push(
                `/cms/content-entries/${model.modelId}?id=${encodeURIComponent(id)}${folderId}`
            );
        },
        [query]
    );

    const { CREATE_CONTENT, UPDATE_CONTENT, CREATE_CONTENT_FROM } = useMemo(() => {
        return {
            CREATE_CONTENT: createCreateMutation(model),
            UPDATE_CONTENT: createUpdateMutation(model),
            CREATE_CONTENT_FROM: createCreateFromMutation(model)
        };
    }, [model.modelId]);

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
     * Note that when passing `error.data` variable we cast as InvalidFieldError[] because we know it is so.
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

    const createContent: FormOnSubmit<CmsContentEntry> = useCallback(
        async (formData, form) => {
            setLoading(true);
            const response = await createMutation({
                variables: {
                    data: {
                        ...formData,
                        /**
                         * Added for the ACO to work.
                         * TODO: introduce hook like onEntryPublish, or similar.
                         */
                        wbyAco_location: {
                            folderId: currentFolderId || ROOT_FOLDER
                        }
                    },
                    options: {
                        skipValidators: form.options.skipValidators
                    }
                },
                fetchPolicy: getFetchPolicy(model)
            });

            setLoading(false);

            /**
             * Finalize "create" process
             */
            if (!response.data) {
                showSnackbar("Missing response data in Create Entry.");
                return;
            }
            const { data: entry, error } = response.data.content || {};
            if (error) {
                showSnackbar(error.message);
                setInvalidFieldValues(error.data as InvalidFieldError[]);
                return;
            } else if (!entry) {
                showSnackbar("Missing entry data in Create Entry Response.");
                return;
            }
            resetInvalidFieldValues();

            if (params.addEntryToListCache) {
                addRecordToCache(entry);
            }

            showSnackbar(`${model.name} entry created successfully!`);
            if (typeof params.onSubmit === "function") {
                params.onSubmit(entry, form);
                return entry;
            }
            goToRevision(entry.id);
            return entry;
        },
        [model.modelId, params.onSubmit, params.addEntryToListCache, query, currentFolderId]
    );

    const updateContent = useCallback(
        async (revision: string, data: CmsContentEntry, form: FormAPI<CmsContentEntry>) => {
            setLoading(true);
            const response = await updateMutation({
                variables: {
                    revision,
                    data,
                    options: {
                        skipValidators: form.options.skipValidators
                    }
                },
                fetchPolicy: getFetchPolicy(model)
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

            updateRecordInCache(entry);

            return entry;
        },
        [model.modelId]
    );

    const createContentFrom = useCallback(
        async (revision: string, formData: Record<string, any>, form: FormAPI<CmsContentEntry>) => {
            setLoading(true);
            const response = await createFromMutation({
                variables: {
                    revision,
                    data: formData,
                    options: {
                        skipValidators: form.options.skipValidators
                    }
                },
                fetchPolicy: getFetchPolicy(model)
            });

            if (!response.data) {
                showSnackbar("Missing data in update callback on Create From Entry Response.");
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

            updateRecordInCache(newRevision);

            showSnackbar("A new revision was created!");
            goToRevision(newRevision.id);

            setLoading(false);

            return newRevision;
        },
        [model.modelId]
    );

    const onChange: FormOnSubmit<CmsContentEntry> = (data, form) => {
        if (!params.onChange) {
            return;
        }
        return params.onChange(data, form);
    };

    const onSubmit: FormOnSubmit<CmsContentEntry> = async (data, form) => {
        const fieldsIds = model.fields.map(item => item.fieldId);
        const formData = pick(data, [...fieldsIds]) as CmsContentEntry;

        const gqlData = prepareFormData<CmsContentEntry>(formData, model.fields);

        if (!entry.id) {
            return createContent(gqlData as CmsContentEntry, form);
        }

        const { meta } = entry;
        const { locked: isLocked } = meta || {};

        if (!isLocked) {
            return updateContent(entry.id, gqlData, form);
        }

        return createContentFrom(entry.id, gqlData, form);
    };

    const defaultValues = useMemo((): Record<string, any> => {
        const values: Record<string, any> = {};
        /**
         * Assign the default values:
         * * check the settings.defaultValue
         * * check the predefinedValues for selected value
         */
        for (const field of model.fields) {
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
    }, [model.modelId]);

    return {
        /**
         * If entry is not set or `entry.id` does not exist, it means it's a new entry, so fetch default values.
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
