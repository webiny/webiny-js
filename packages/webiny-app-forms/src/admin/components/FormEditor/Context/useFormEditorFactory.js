// @flow
import React from "react";
import shortid from "shortid";
import { get, cloneDeep, pick } from "lodash";
import { GET_FORM, UPDATE_REVISION } from "./graphql";
import { getFieldPosition, moveField, moveRow, deleteField } from "./functions";
import { getPlugins } from "webiny-plugins";

import type {
    FieldsLayoutType,
    FieldType,
    FieldIdType,
    FieldLayoutPositionType
} from "webiny-app-forms/types";

export default FormEditorContext => {
    return () => {
        const context = React.useContext(FormEditorContext);
        if (!context) {
            throw new Error("useFormEditor must be used within a FormEditorProvider");
        }

        const { state, dispatch } = context;

        const self = {
            apollo: state.apollo,
            data: state.data,
            state,
            async getForm(id: string) {
                const response = await self.apollo.query({ query: GET_FORM, variables: { id } });
                const { data, error } = get(response, "data.forms.getForm");
                if (error) {
                    throw new Error(error);
                }

                self.setData(() => {
                    const form = cloneDeep(data);
                    if (!form.settings.layout.renderer) {
                        form.settings.layout.renderer = state.defaultLayoutRenderer;
                    }
                    return form;
                }, false);

                return response;
            },
            saveForm: async data => {
                data = data || state.data;
                let response = await self.apollo.mutate({
                    mutation: UPDATE_REVISION,
                    variables: {
                        id: data.id,
                        data: pick(data, ["layout", "fields", "name", "settings", "triggers"])
                    }
                });

                return get(response, "data.forms.updateRevision");
            },
            /**
             * Set form data by providing a callback, which receives a fresh copy of data on which you can work on.
             * Return new data once finished.
             * @param setter
             * @param saveForm
             */
            setData(setter: Function, saveForm = true) {
                const data = setter(cloneDeep(self.data));
                dispatch({ type: "data", data });
                saveForm !== false && self.saveForm(data);
            },

            /**
             * Returns fields list or complete layout with fields data in it (not just field IDs).
             * @param layout
             * @returns {*}
             */
            getFields(layout: boolean = false): Array<FieldType> | FieldsLayoutType {
                if (!layout) {
                    return state.data.fields;
                }

                // Replace every field ID with actual field object.
                const fields = cloneDeep(state.data.layout);
                fields.forEach((row, rowIndex) => {
                    row.forEach((fieldId, fieldIndex) => {
                        fields[rowIndex][fieldIndex] = self.getField({ _id: fieldId });
                    });
                });
                return fields;
            },

            /**
             * Return field plugin.
             * @param query
             * @returns {void|?FieldType}
             */
            getFieldPlugin(query: Object): ?Object {
                return getPlugins("form-editor-field-type").find(({ field }) => {
                    for (let key in query) {
                        if (!(key in field)) {
                            return null;
                        }

                        if (field[key] !== query[key]) {
                            return null;
                        }
                    }

                    return true;
                });
            },

            /**
             * Checks if field of given type already exists in the list of fields.
             * @param query
             * @returns {boolean}
             */
            getField(query: Object): ?FieldType {
                return state.data.fields.find(field => {
                    for (let key in query) {
                        if (!(key in field)) {
                            return null;
                        }

                        if (field[key] !== query[key]) {
                            return null;
                        }
                    }

                    return true;
                });
            },

            /**
             * Inserts a new field into the target position.
             * @param data
             * @param position
             */
            insertField(data: FieldType, position: FieldLayoutPositionType) {
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
             * @param field
             * @param position
             * @param data
             */
            moveField({
                field,
                position
            }: {
                field: FieldIdType | FieldType,
                position: Object,
                data: ?Object
            }) {
                self.setData(data => {
                    moveField({ field, position, data });
                    return data;
                });
            },

            /**
             * Moves row to a destination row.
             * @param source
             * @param destination
             */
            moveRow(source: number, destination: number) {
                self.setData(data => {
                    moveRow({ data, source, destination });
                    return data;
                });
            },

            /**
             * Updates field.
             * @param fieldData
             */
            updateField(fieldData) {
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
             * @param field
             */
            deleteField(field: FieldType) {
                self.setData(data => {
                    deleteField({ field, data });
                    return data;
                });
            },

            /**
             * Returns row / index position for given field.
             * @param field
             * @returns {{index: number, row: number}|{index: null, row: null}}
             */
            getFieldPosition(field: FieldIdType | FieldType) {
                return getFieldPosition({ field, data: self.data });
            }
        };

        // TODO: remove this once ready.
        window.useFormEditor = self;
        return self;
    };
};
