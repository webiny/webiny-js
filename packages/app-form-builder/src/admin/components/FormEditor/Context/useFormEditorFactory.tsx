import React from "react";
import shortid from "shortid";
import cloneDeep from "lodash/cloneDeep";
import pick from "lodash/pick";
import {
    GET_FORM,
    GetFormQueryResponse,
    GetFormQueryVariables,
    UPDATE_REVISION,
    UpdateFormRevisionMutationResponse,
    UpdateFormRevisionMutationVariables
} from "./graphql";
import { getFieldPosition, moveField, moveRow, deleteField, moveStep } from "./functions";
import { plugins } from "@webiny/plugins";

import {
    FbFormModelField,
    FieldIdType,
    FieldLayoutPositionType,
    FbBuilderFieldPlugin,
    FbFormModel,
    FbUpdateFormInput,
    FbErrorResponse,
    FbFormStep,
    StepLayoutPositionType,
    MoveFieldParams
} from "~/types";
import { ApolloClient } from "apollo-client";
import {
    FormEditorFieldError,
    FormEditorProviderContext,
    FormEditorProviderContextState
} from "~/admin/components/FormEditor/Context/index";
import dotProp from "dot-prop-immutable";
import { useSnackbar } from "@webiny/app-admin";
import { mdbid } from "@webiny/utils";

interface SetDataCallable {
    (value: FbFormModel): FbFormModel;
}

interface MoveStepParams {
    step: FbFormStep;
    position: StepLayoutPositionType;
}

type State = FormEditorProviderContextState;
export interface FormEditor {
    apollo: ApolloClient<any>;
    data: FbFormModel;
    errors: FormEditorFieldError[] | null;
    state: State;
    addStep: () => void;
    deleteStep: (id: string) => void;
    updateStep: (title: string, id: string | null) => void;
    getForm: (id: string) => Promise<{ data: GetFormQueryResponse }>;
    saveForm: (
        data: FbFormModel | null
    ) => Promise<{ data: FbFormModel | null; error: FbErrorResponse | null }>;
    setData: (setter: SetDataCallable, saveForm?: boolean) => Promise<void>;
    getFields: () => FbFormModelField[];
    getLayoutFields: (stepId?: string) => FbFormModelField[][];
    getField: (query: Partial<Record<keyof FbFormModelField, string>>) => FbFormModelField | null;
    getFieldPlugin: (
        query: Partial<Record<keyof FbBuilderFieldPlugin["field"], string>>
    ) => FbBuilderFieldPlugin | null;
    insertField: (
        field: FbFormModelField,
        position: FieldLayoutPositionType,
        stepId?: string
    ) => void;
    moveField: (params: MoveFieldParams & { stepId?: string }) => void;
    moveRow: (source: number, destination: number, stepId?: string, anotherStepId?: any) => void;
    moveStep: (params: MoveStepParams) => void;
    updateField: (field: FbFormModelField) => void;
    deleteField: (field: FbFormModelField, stepId?: string) => void;
    getFieldPosition: (field: FieldIdType | FbFormModelField) => FieldLayoutPositionType | null;
}

const extractFieldErrors = (error: FbErrorResponse, form: FbFormModel): FormEditorFieldError[] => {
    const invalidFields: any[] = dotProp.get(error, "data.invalidFields.fields.data", []);
    if (Array.isArray(invalidFields) === false) {
        return [];
    }

    const results: Record<string, FormEditorFieldError> = {};
    for (const invalidField of invalidFields) {
        if (!invalidField.data || !invalidField.data.invalidFields) {
            continue;
        }
        const index = invalidField.data.index;
        if (index === undefined) {
            console.log("Could not determine field index from given error.");
            console.log(invalidField.data);
            continue;
        }
        const field = form.fields[index];
        if (!field) {
            console.log(`Could not get field by index ${index}. There is an error in it.`);
            continue;
        }

        const er = invalidField.data.invalidFields;

        if (!results[field.fieldId]) {
            results[field.fieldId] = {
                fieldId: field.fieldId,
                label: field.label || field.fieldId,
                index,
                errors: {}
            };
        }

        results[field.fieldId].errors = Object.keys(er).reduce((collection, key) => {
            collection[key] = er[key].message || "unknown error";
            return collection;
        }, results[field.fieldId].errors);
    }
    return Object.values(results);
};

export const useFormEditorFactory = (
    FormEditorContext: React.Context<FormEditorProviderContext>
) => {
    return () => {
        const context = React.useContext<FormEditorProviderContext>(FormEditorContext);
        if (!context) {
            throw new Error("useFormEditor must be used within a FormEditorProvider");
        }

        const { showSnackbar } = useSnackbar();

        const { state, dispatch } = context;

        const self: FormEditor = {
            apollo: state.apollo,
            data: state.data || ({} as FbFormModel),
            errors: state.errors,
            state,
            async getForm(id) {
                const response = await self.apollo.query<
                    GetFormQueryResponse,
                    GetFormQueryVariables
                >({
                    query: GET_FORM,
                    variables: { revision: decodeURIComponent(id) }
                });
                const { data, error } = response?.data?.formBuilder?.getForm || {};
                if (error) {
                    throw new Error(error.message);
                }

                // Here we need to set ids to the steps.
                // Because we are not storing them on the API side.
                // We need those ids in order to change title for the corresponding step.
                // Or when we need to delete corresponding step.
                const modifiedData = {
                    ...data,
                    steps: data?.steps.map(formStep => ({
                        ...formStep,
                        id: mdbid()
                    }))
                };

                self.setData(() => {
                    const form = cloneDeep(modifiedData) as FbFormModel;
                    if (!form.settings.layout.renderer) {
                        form.settings.layout.renderer = state.defaultLayoutRenderer;
                    }
                    return form;
                }, false);

                return response;
            },
            saveForm: async data => {
                data = data || state.data;
                // Removing id fields from steps before sending to the API.
                // Because API side does not need to store the id.
                data = {
                    ...data,
                    steps: data.steps.map(formStep => pick(formStep, ["title", "layout"]))
                };
                if (!data) {
                    return {
                        data: null,
                        error: {
                            message: "Missing form data to be saved."
                        }
                    };
                }
                const response = await self.apollo.mutate<
                    UpdateFormRevisionMutationResponse,
                    UpdateFormRevisionMutationVariables
                >({
                    mutation: UPDATE_REVISION,
                    variables: {
                        revision: decodeURIComponent(data.id),
                        /**
                         * We can safely cast as FbFormModel is FbUpdateFormInput after all, but with some optional values.
                         */
                        data: pick(data as FbUpdateFormInput, [
                            "layout",
                            "steps",
                            "fields",
                            "name",
                            "settings",
                            "triggers"
                        ])
                    }
                });

                const values = dotProp.get(response, "data.formBuilder.updateRevision", {});

                const { data: responseData, error: responseError } = values || {};

                return {
                    data: responseData || null,
                    error: responseError || null
                };
            },
            /**
             * Set form data by providing a callback, which receives a fresh copy of data on which you can work on.
             * Return new data once finished.
             */
            setData: async (setter, saveForm = true) => {
                const data = setter(cloneDeep(self.data));
                dispatch({
                    type: "data",
                    data
                });
                if (!saveForm) {
                    return;
                }
                const { error } = await self.saveForm(data);
                if (!error) {
                    return;
                }
                const errors = extractFieldErrors(error, data);
                if (Object.keys(errors).length === 0) {
                    showSnackbar(
                        "Unspecified Form Builder error. Please check the console for more details."
                    );
                    console.log(error);
                    return;
                }
                dispatch({
                    type: "errors",
                    errors
                });
                showSnackbar(<h6>Error while saving form!</h6>);
            },

            /**
             * Returns fields list.
             */
            getFields() {
                if (!state.data) {
                    return [];
                }
                return state.data.fields;
            },
            /**
             * Returns complete layout with fields data in it (not just field IDs)
             */
            getLayoutFields: stepId => {
                const stepLayout = state.data.steps.find(v => v.id === stepId)?.layout;
                // Replace every field ID with actual field object.
                // @ts-ignore
                return stepLayout.map(row => {
                    return row
                        .map(id => {
                            return self.getField({
                                _id: id
                            });
                        })
                        .filter(Boolean) as FbFormModelField[];
                });
            },

            /**
             * Return field plugin.
             */
            getFieldPlugin(query) {
                return (
                    plugins
                        .byType<FbBuilderFieldPlugin>("form-editor-field-type")
                        .find(({ field }) => {
                            for (const key in query) {
                                if (!(key in field)) {
                                    return false;
                                }
                                const fieldKeyValue =
                                    field[key as keyof FbBuilderFieldPlugin["field"]];
                                const queryKeyValue =
                                    query[key as keyof FbBuilderFieldPlugin["field"]];

                                if (fieldKeyValue !== queryKeyValue) {
                                    return false;
                                }
                            }

                            return true;
                        }) || null
                );
            },

            /**
             * Checks if field of given type already exists in the list of fields.
             */
            getField(query) {
                return (
                    state.data.fields.find(field => {
                        for (const key in query) {
                            if (!(key in field)) {
                                return false;
                            }
                            const fieldKeyValue = field[key as keyof FbFormModelField];
                            const queryKeyValue = query[key as keyof FbFormModelField];

                            if (fieldKeyValue !== queryKeyValue) {
                                return false;
                            }
                        }

                        return true;
                    }) || null
                );
            },
            addStep: () => {
                self.setData(data => {
                    data.steps.push({
                        id: mdbid(),
                        title: "",
                        layout: []
                    });

                    return data;
                });
            },
            deleteStep: (id: string) => {
                self.setData(data => {
                    const deleteStepIndex = data.steps.findIndex(step => step.id === id);
                    data.steps.splice(deleteStepIndex, 1);

                    return data;
                });
            },
            updateStep: (stepTitle, id) => {
                self.setData(data => {
                    const stepIndex = data.steps.findIndex(step => step.id === id);
                    data.steps[stepIndex].title = stepTitle;
                    return data;
                });
            },
            /**
             * Inserts a new field into the target position.
             */
            insertField: (data, position, stepId) => {
                const field = cloneDeep(data);
                if (!field._id) {
                    field._id = shortid.generate();
                }

                if (!data.name) {
                    throw new Error(`Field "name" missing.`);
                }

                const fieldPlugin = self.getFieldPlugin({ name: data.name });
                if (!fieldPlugin) {
                    throw new Error(`Invalid field "name".`);
                }

                data.type = fieldPlugin.field.type;

                self.setData(data => {
                    if (!Array.isArray(data.fields)) {
                        data.fields = [];
                    }
                    data.fields.push(field);

                    moveField({
                        field,
                        position,
                        data,
                        stepId
                    });

                    // We are dropping a new field at the specified index.
                    return data;
                });
            },

            /**
             * Moves field to the given target position.
             */
            moveField: ({ field, position, stepId, anotherStepId }) => {
                self.setData(data => {
                    moveField({
                        field,
                        position,
                        data,
                        stepId,
                        anotherStepId
                    });
                    return data;
                });
            },
            moveStep: ({ step, position }) => {
                self.setData(data => {
                    moveStep({
                        step,
                        position,
                        data: data.steps
                    });

                    return data;
                });
            },
            /**
             * Moves row to a destination row.
             */
            moveRow: (source, destination, stepId, anotherStepId) => {
                self.setData(data => {
                    moveRow({
                        // @ts-ignore
                        data: data.steps.find(v => v.id === stepId),
                        source,
                        destination,
                        stepId,
                        anotherStep: anotherStepId,
                        allSteps: data
                    });
                    return data;
                });
            },

            /**
             * Updates field.
             */
            updateField: fieldData => {
                const field = cloneDeep(fieldData);
                self.setData(data => {
                    for (let i = 0; i < data.fields.length; i++) {
                        if (data.fields[i]._id === field._id) {
                            data.fields[i] = field;
                            break;
                        }
                    }
                    return data;
                });
            },

            /**
             * Deletes a field (both from the list of field and the layout).
             */
            deleteField: (field, stepId) => {
                self.setData(data => {
                    deleteField({ field, data, stepId });
                    return data;
                });
            },

            /**
             * Returns row / index position for given field.
             */
            getFieldPosition: field => {
                return getFieldPosition({ field, data: self.data });
            }
        };

        return self;
    };
};
