/**
 * Definition for the rich text field to use in the tests.
 * This will test the plugins:
 * - FileAttributePlugin - add new attribute to the Files entity definition
 * - ElasticsearchFieldPlugin - field transformations and definitions for the elasticsearch
 * - GraphQLSchemaPlugin - add new schema definitions to the existing graphql
 */
import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch/plugins/definition";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { FileAttributePlugin } from "~/plugins/FileAttributePlugin";
import WebinyError from "@webiny/error";
import { FilePlugin } from "@webiny/api-file-manager/plugins/definitions";

const fieldName = "richText";

export class FileManagerElasticsearchRichTextFieldPlugin extends ElasticsearchFieldPlugin {
    getBasePath(field: string): string {
        if (field === "richTextText") {
            return `${fieldName}.text`;
        } else if (field === "richTextEditor") {
            return `${fieldName}.editor`;
        }
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
     * Must add new field to attributes of the Entity definition.
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
        entity: "Files",
        field: fieldName,
        sortable: false,
        keyword: true,
        searchable: false,
        unmappedType: undefined
    }),
    new GraphQLSchemaPlugin({
        resolvers: {
            FmQuery: {},
            FmMutation: {},
            File: {}
        },
        typeDefs: `
            type FileRichTextInput {
                editor: String!
                data: JSON!
            }
            extend input FileInput {
                richText: FileRichTextInput
            }
            type FileRichText {
                editor: String
                data: JSON
            }
            type FileWhereInputRichText {
                editor: String
                text: String
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
            validateRichTextField(file);
        },
        beforeUpdate: async params => {
            const file = params.data as any;
            validateRichTextField(file);
        },
        beforeBatchCreate: async params => {
            for (const file of params.data) {
                validateRichTextField(file as any);
            }
        }
    })
];
