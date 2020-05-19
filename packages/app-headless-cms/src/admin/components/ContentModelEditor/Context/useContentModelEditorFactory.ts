import React from "react";
import shortid from "shortid";
import { get, cloneDeep, pick } from "lodash";
import { GET_CONTENT_MODEL, UPDATE_CONTENT_MODEL } from "./graphql";
import { getFieldPosition, moveField, moveRow, deleteField } from "./functions";
import { getPlugins } from "@webiny/plugins";
import omit from "lodash/omit";

import {
    CmsEditorFieldsLayout,
    CmsEditorField,
    CmsEditorFieldId,
    FieldLayoutPositionType,
    CmsEditorFieldTypePlugin
} from "@webiny/app-headless-cms/types";

export default ContentModelEditorContext => {
    return () => {
        // TODO: @ts-adrian add proper type
        const context = React.useContext<any>(ContentModelEditorContext);
        if (!context) {
            throw new Error(
                "useContentModelEditor must be used within a ContentModelEditorProvider"
            );
        }

        const { state, dispatch } = context;

        const self = {
            apollo: state.apollo,
            data: state.data,
            state,
            async getContentModel(id: string) {
                const response = await self.apollo.query({
                    query: GET_CONTENT_MODEL,
                    variables: { id }
                });

                const { data, error } = get(response, "data.getContentModel");
                if (error) {
                    throw new Error(error);
                }

                self.setData(() => cloneDeep(data), false);
                return response;
            },
            saveContentModel: async (rawData = state.data) => {
                const data = cloneDeep(rawData);
                // Remove "createdOn" from entries in the "indexes" field.
                data.indexes = data.indexes.map(item => omit(item, ["createdOn"]));

                const response = await self.apollo.mutate({
                    mutation: UPDATE_CONTENT_MODEL,
                    variables: {
                        id: data.id,
                        data: pick(data, [
                            "layout",
                            "fields",
                            "name",
                            "settings",
                            "description",
                            "titleFieldId",
                            "indexes"
                        ])
                    }
                });

                return get(response, "data.updateContentModel");
            },
            /**
             * Set form data by providing a callback, which receives a fresh copy of data on which you can work on.
             * Return new data once finished.
             * @param setter
             * @param saveContentModel
             */
            setData(setter: Function, saveContentModel = false) {
                const data = setter(cloneDeep(self.data));
                dispatch({ type: "data", data });
                return saveContentModel !== false && self.saveContentModel(data);
            },

            /**
             * Returns fields list or complete layout with fields data in it (not just field IDs).
             * @param layout
             * @returns {*}
             */
            getFields(
                layout = false
            ): CmsEditorField[] | CmsEditorFieldsLayout {
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
             * @returns {void|?CmsEditorField}
             */
            getFieldPlugin(query: object): CmsEditorFieldTypePlugin {
                return getPlugins<CmsEditorFieldTypePlugin>("cms-editor-field-type").find(
                    ({ field }) => {
                        for (const key in query) {
                            if (!(key in field)) {
                                return null;
                            }

                            if (field[key] !== query[key]) {
                                return null;
                            }
                        }

                        return true;
                    }
                );
            },

            /**
             * Checks if field of given type already exists in the list of fields.
             * @param query
             * @returns {boolean}
             */
            getField(query: object): CmsEditorField {
                return state.data.fields.find(field => {
                    for (const key in query) {
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
            insertField(data: CmsEditorField, position: FieldLayoutPositionType) {
                const field = cloneDeep(data);
                if (!field._id) {
                    field._id = shortid.generate();
                }

                if (!data.type) {
                    throw new Error(`Field "type" missing.`);
                }

                const fieldPlugin = self.getFieldPlugin({ type: data.type });
                if (!fieldPlugin) {
                    throw new Error(`Invalid field "type".`);
                }

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
                field: CmsEditorFieldId | CmsEditorField;
                position: FieldLayoutPositionType;
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
            deleteField(field: CmsEditorField) {
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
            getFieldPosition(field: CmsEditorFieldId | CmsEditorField) {
                return getFieldPosition({ field, data: self.data });
            }
        };

        return self;
    };
};
