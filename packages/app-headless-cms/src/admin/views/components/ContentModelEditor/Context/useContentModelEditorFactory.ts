import React from "react";
import shortid from "shortid";
import { get, cloneDeep, pick } from "lodash";
import { GET_CONTENT_MODEL, UPDATE_CONTENT_MODEL } from "./graphql";
import { getFieldPosition, moveField, moveRow, deleteField } from "./functions";
import { plugins } from "@webiny/plugins";

import {
    CmsEditorFieldsLayout,
    CmsEditorField,
    CmsEditorFieldId,
    FieldLayoutPosition,
    CmsEditorFieldTypePlugin,
    CmsEditorContentModel
} from "@webiny/app-headless-cms/types";
import ApolloClient from "apollo-client";

type PickedCmsEditorContentModel = Pick<
    CmsEditorContentModel,
    "layout" | "fields" | "name" | "settings" | "description" | "titleFieldId"
>;
/**
 * cleanup is required because backend always expects string value in predefined values entries
 */
const cleanupModelDataFields = (fields: CmsEditorField[]): CmsEditorField[] => {
    return fields.map(field => {
        const { predefinedValues } = field;
        const { enabled = false, values = [] } = predefinedValues || {};
        return {
            ...field,
            predefinedValues: {
                enabled,
                values: values.map(({ label, value }) => {
                    return {
                        label,
                        value: String(value)
                    };
                })
            }
        };
    });
};

const cleanupModelData = (data: PickedCmsEditorContentModel): PickedCmsEditorContentModel => {
    return {
        ...data,
        fields: cleanupModelDataFields(data.fields)
    };
};

interface InternalContext {
    state: {
        apollo: ApolloClient<any>;
        data: Record<string, any>;
    };
    dispatch: (values: Record<string, any>) => void;
}

interface MoveFieldArgs {
    field: CmsEditorFieldId | CmsEditorField;
    position: FieldLayoutPosition;
}

/**
 * @internal
 * @hidden
 */
export interface ContentModelEditorFactoryContext {
    apollo: ApolloClient<any>;
    data: CmsEditorContentModel;
    state: Record<string, any>;
    getContentModel: (modelId: string) => Promise<any>;
    saveContentModel: (data?: Record<string, any>) => Promise<any>;
    setData: (setter: Function, saveContentModel?: boolean) => Promise<any>;
    getFields: (layout: boolean) => any;
    getFieldPlugin: (query: object) => any;
    getField: (query: object) => any;
    insertField: (data: CmsEditorField, position: FieldLayoutPosition) => void;
    moveField: (args: MoveFieldArgs) => void;
    moveRow: (source: number, destination: number) => void;
    updateField: (field: CmsEditorField) => void;
    deleteField: (field: CmsEditorField) => void;
    getFieldPosition: (field: CmsEditorFieldId | CmsEditorField) => FieldLayoutPosition;
}

export default ContentModelEditorContext => {
    return (): ContentModelEditorFactoryContext => {
        const context = React.useContext<InternalContext>(ContentModelEditorContext);
        if (!context) {
            throw new Error(
                "useContentModelEditor must be used within a ContentModelEditorProvider"
            );
        }

        const { state, dispatch } = context;

        const setPristine = flag => {
            dispatch({ type: "state", data: { isPristine: flag } });
        };

        const self: ContentModelEditorFactoryContext = {
            apollo: state.apollo,
            data: state.data as any,
            state,
            async getContentModel(modelId: string) {
                const response = await self.apollo.query({
                    query: GET_CONTENT_MODEL,
                    variables: { modelId }
                });

                const { data, error } = get(response, "data.getContentModel");
                if (error) {
                    throw new Error(error);
                }

                self.setData(() => {
                    setPristine(true);
                    return cloneDeep(data);
                }, false);
                return response;
            },
            saveContentModel: async (data = state.data) => {
                const modelData: PickedCmsEditorContentModel = pick(data, [
                    "layout",
                    "fields",
                    "name",
                    "settings",
                    "description",
                    "titleFieldId"
                ]);
                const response = await self.apollo.mutate({
                    mutation: UPDATE_CONTENT_MODEL,
                    variables: {
                        modelId: data.modelId,
                        data: cleanupModelData(modelData)
                    }
                });

                setPristine(true);

                return get(response, "data.updateContentModel");
            },
            /**
             * Set form data by providing a callback, which receives a fresh copy of data on which you can work on.
             * Return new data once finished.
             * @param setter
             * @param saveContentModel
             */
            setData(setter: Function, saveContentModel = false) {
                setPristine(false);
                const data = setter(cloneDeep(self.data));
                dispatch({ type: "data", data });
                return saveContentModel !== false && self.saveContentModel(data);
            },

            /**
             * Returns fields list or complete layout with fields data in it (not just field IDs).
             * @param layout
             * @returns {*}
             */
            getFields(layout = false): CmsEditorField[] | CmsEditorFieldsLayout {
                if (!layout) {
                    return state.data.fields;
                }

                // Replace every field ID with actual field object.
                const fields = cloneDeep(state.data.layout);
                fields.forEach((row, rowIndex) => {
                    row.forEach((fieldId, fieldIndex) => {
                        fields[rowIndex][fieldIndex] = self.getField({ id: fieldId });
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
                return plugins
                    .byType<CmsEditorFieldTypePlugin>("cms-editor-field-type")
                    .find(({ field }) => {
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
            insertField(data: CmsEditorField, position: FieldLayoutPosition) {
                const field = cloneDeep(data);
                if (!field.id) {
                    field.id = shortid.generate();
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
                position: FieldLayoutPosition;
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
                        if (data.fields[i].id === field.id) {
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
