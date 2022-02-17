import React from "react";
import shortid from "shortid";
import { cloneDeep, pick } from "lodash";
import {
    GET_FORM,
    GetFormQueryResponse,
    GetFormQueryVariables,
    UPDATE_REVISION,
    UpdateFormRevisionMutationResponse,
    UpdateFormRevisionMutationVariables
} from "./graphql";
import { getFieldPosition, moveField, moveRow, deleteField } from "./functions";
import { plugins } from "@webiny/plugins";

import {
    FbFormModelField,
    FieldIdType,
    FieldLayoutPositionType,
    FbBuilderFieldPlugin,
    FbFormModel,
    FbUpdateFormInput,
    FbErrorResponse
} from "~/types";
import { ApolloClient } from "apollo-client";
import {
    FormEditorProviderContext,
    FormEditorProviderContextState
} from "~/admin/components/FormEditor/Context/index";

interface SetDataCallable<T = any> {
    (value: T): T;
}

interface MoveFieldParams {
    field: FieldIdType | FbFormModelField;
    position: FieldLayoutPositionType;
}

type State = FormEditorProviderContextState;
export interface FormEditor {
    apollo: ApolloClient<any>;
    data: FbFormModel;
    state: State;
    getForm: (id: string) => Promise<{ data: GetFormQueryResponse }>;
    saveForm: (
        data?: FbFormModel
    ) => Promise<{ data: FbFormModel | null; error: FbErrorResponse | null }>;
    setData: (setter: SetDataCallable, saveForm?: boolean) => Promise<void>;
    getFields: () => FbFormModelField[];
    getLayoutFields: () => FbFormModelField[][];
    getField: (query: Partial<Record<keyof FbFormModelField, string>>) => FbFormModelField;
    getFieldPlugin: (
        query: Partial<Record<keyof FbBuilderFieldPlugin["field"], string>>
    ) => FbBuilderFieldPlugin;
    insertField: (field: FbFormModelField, position: FieldLayoutPositionType) => void;
    moveField: (params: MoveFieldParams) => void;
    moveRow: (source: number, destination: number) => void;
    updateField: (field: FbFormModelField) => void;
    deleteField: (field: FbFormModelField) => void;
    getFieldPosition: (field: FieldIdType | FbFormModelField) => FieldLayoutPositionType;
}

export const useFormEditorFactory = (
    FormEditorContext: React.Context<FormEditorProviderContext>
) => {
    return () => {
        const context = React.useContext<FormEditorProviderContext>(FormEditorContext);
        if (!context) {
            throw new Error("useFormEditor must be used within a FormEditorProvider");
        }

        const { state, dispatch } = context;

        const self: FormEditor = {
            apollo: state.apollo,
            data: state.data,
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

                self.setData(() => {
                    const form = cloneDeep(data) as FbFormModel;
                    if (!form.settings.layout.renderer) {
                        form.settings.layout.renderer = state.defaultLayoutRenderer;
                    }
                    return form;
                }, false);

                return response;
            },
            saveForm: async data => {
                data = data || state.data;
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
                            "fields",
                            "name",
                            "settings",
                            "triggers"
                        ])
                    }
                });

                return (
                    response?.data?.formBuilder?.updateRevision || {
                        data: null,
                        error: null
                    }
                );
            },
            /**
             * Set form data by providing a callback, which receives a fresh copy of data on which you can work on.
             * Return new data once finished.
             */
            setData: async (setter, saveForm = true) => {
                const data = setter(cloneDeep(self.data));
                dispatch({ type: "data", data });
                if (saveForm !== true) {
                    return;
                }
                self.saveForm(data);
            },

            /**
             * Returns fields list.
             */
            getFields() {
                return state.data.fields;
            },
            /**
             * Returns complete layout with fields data in it (not just field IDs)
             */
            getLayoutFields: () => {
                // Replace every field ID with actual field object.
                return state.data.layout.map(row => {
                    return row.map(id => {
                        return self.getField({
                            _id: id
                        });
                    });
                });
            },

            /**
             * Return field plugin.
             */
            getFieldPlugin(query) {
                return plugins
                    .byType<FbBuilderFieldPlugin>("form-editor-field-type")
                    .find(({ field }) => {
                        for (const key in query) {
                            if (!(key in field)) {
                                return false;
                            }
                            const fieldKeyValue = field[key as keyof FbBuilderFieldPlugin["field"]];
                            const queryKeyValue = query[key as keyof FbBuilderFieldPlugin["field"]];

                            if (fieldKeyValue !== queryKeyValue) {
                                return false;
                            }
                        }

                        return true;
                    });
            },

            /**
             * Checks if field of given type already exists in the list of fields.
             */
            getField(query) {
                return state.data.fields.find(field => {
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
                });
            },

            /**
             * Inserts a new field into the target position.
             */
            insertField: (data, position) => {
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

                    moveField({ field, position, data });

                    // We are dropping a new field at the specified index.
                    return data;
                });
            },

            /**
             * Moves field to the given target position.
             */
            moveField: ({ field, position }) => {
                self.setData(data => {
                    moveField({ field, position, data });
                    return data;
                });
            },

            /**
             * Moves row to a destination row.
             */
            moveRow: (source, destination) => {
                self.setData(data => {
                    moveRow({ data, source, destination });
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
            deleteField: field => {
                self.setData(data => {
                    deleteField({ field, data });
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
