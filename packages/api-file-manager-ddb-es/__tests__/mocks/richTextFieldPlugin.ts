/**
 * Definition for the rich text field to use in the tests.
 * This will test the plugins:
 * - FileAttributePlugin - add new attribute to the Files entity definition
 * - ElasticsearchFieldPlugin - field transformations and definitions for the elasticsearch
 * - GraphQLSchemaPlugin - add new schema definitions to the existing graphql
 * - FilePlugin - lifecycle events when saving
 * - FileStorageTransformPlugin - transform the file data to and from the storage engine
 * - FileIndexTransformPlugin - transform the file data to and from index engine
 */
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { FileAttributePlugin } from "~/plugins/FileAttributePlugin";
import WebinyError from "@webiny/error";
import { FilePlugin } from "@webiny/api-file-manager/plugins/definitions/FilePlugin";
import { FileStorageTransformPlugin } from "@webiny/api-file-manager/plugins/definitions/FileStorageTransformPlugin";
import * as jsonpack from "jsonpack";
import { FileIndexTransformPlugin } from "~/plugins/FileIndexTransformPlugin";
import { FileElasticsearchFieldPlugin } from "~/plugins/FileElasticsearchFieldPlugin";

const fieldName = "richText";

export class FileManagerElasticsearchRichTextFieldPlugin extends FileElasticsearchFieldPlugin {
    public override getBasePath(field: string): string {
        if (field === "richTextText") {
            return `${fieldName}.text`;
        } else if (field === "richTextEditor") {
            return `${fieldName}.editor`;
        }
        return "";
    }
}

const validateRichTextField = (file: File & Record<string, any>): void => {
    /**
     * If there is no field, do nothing.
     */
    if (!file.richText) {
        return;
    }
    const { data, editor } = file.richText || {};
    /**
     * In case we have editor but no data, throw an error.
     */
    if (editor && !data) {
        throw new WebinyError(`Missing data value in the richText field.`, "VALIDATION_ERROR", {
            editor
        });
    } else if (!editor && data) {
        /**
         * In case we have data and not the editor, throw an error.
         */
        throw new WebinyError(`Missing editor value in the richText field.`, "VALIDATION_ERROR", {
            data
        });
    }
};

export default () => [
    /**
     * Must add new field to attributes of the object being stored and to the Entity definition.
     */
    new FileAttributePlugin({
        attribute: fieldName,
        params: {
            type: "map"
        }
    }),
    /**
     * A plugin that is required for Elasticsearch query builder to work.
     */
    new FileManagerElasticsearchRichTextFieldPlugin({
        field: fieldName,
        sortable: false,
        keyword: true,
        searchable: false,
        unmappedType: undefined
    }),
    new GraphQLSchemaPlugin({
        typeDefs: `
            input FileRichTextInput {
                editor: String!
                data: JSON!
            }
            extend input CreateFileInput {
                richText: FileRichTextInput
            }
             extend input UpdateFileInput {
                richText: FileRichTextInput
            }
            type FileRichText {
                editor: String
                data: JSON
            }
            input FileWhereInputRichText {
                editor: String
                data: JSON
            }
            extend type File {
                richText: FileRichText
            }
            extend input FileWhereInput {
                richText: FileWhereInputRichText
            }
        `
    }),
    /**
     * We want to validate file data so we need to add the lifecycle events.
     */
    new FilePlugin({
        beforeCreate: async params => {
            const file = params.data as any;
            if (!file.richText) {
                return;
            }
            validateRichTextField(file);
        },
        beforeUpdate: async params => {
            const file = params.data as any;
            if (!file.richText) {
                return;
            }
            validateRichTextField(file);
        },
        beforeBatchCreate: async params => {
            for (const file of params.data) {
                if (!file.richText) {
                    continue;
                }
                validateRichTextField(file as any);
            }
        }
    }),
    new FileStorageTransformPlugin({
        toStorage: async ({ file }) => {
            const value = file.richText;
            return {
                ...file,
                richText: jsonpack.pack(value)
            };
        },
        fromStorage: async ({ file }) => {
            const value = file.richText;
            return {
                ...file,
                richText: value ? jsonpack.unpack(value) : null
            };
        }
    }),
    new FileIndexTransformPlugin({
        toIndex: async ({ file }) => {
            const newFile = {
                ...file
            };
            const value = file.richText;
            delete newFile.richText;
            return {
                ...newFile,
                rawValues: {
                    ...(newFile.rawValues || {}),
                    richText: value ? jsonpack.pack(value) : null
                }
            };
        },
        fromIndex: async ({ file }) => {
            const rawValues = {
                ...(file.rawValues || {})
            };
            const value = rawValues.richText;
            delete rawValues.richText;
            return {
                ...file,
                richText: value ? jsonpack.unpack(value) : null
            };
        }
    })
];
