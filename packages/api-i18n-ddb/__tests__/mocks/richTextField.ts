/* eslint-disable */
/**
 * Definition for the rich text field to use in the tests.
 * This will test the plugins:
 * - LocalesAttributePlugin - add new attribute to the Files entity definition
 * - GraphQLSchemaPlugin - add new schema definitions to the existing graphql
 * - FilePlugin - lifecycle events when saving
 * - FileStorageTransformPlugin - transform the file data to and from the storage engine
 */
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import WebinyError from "@webiny/error";
import * as jsonpack from "jsonpack";
import { LocalesAttributePlugin } from "~/plugins/LocalesAttributePlugin";

const fieldName = "richText";

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
    new LocalesAttributePlugin({
        attribute: fieldName,
        params: {
            type: "map"
        }
    }),
    new GraphQLSchemaPlugin({
        typeDefs: `
            input I18NLocaleRichTextInput {
                editor: String!
                data: JSON!
            }
            extend input I18NLocaleInput {
                richText: I18NLocaleRichTextInput
            }
            type I18NLocaleRichText {
                editor: String
                data: JSON
            }
            input I18NLocaleWhereInputRichText {
                editor: String
                data: JSON
            }
            extend type I18NLocale {
                richText: I18NLocaleRichText
            }
            extend input I18NLocaleWhereInput {
                richText: I18NLocaleWhereInputRichText
            }
        `
    }),
    /**
     * We want to validate file data so we need to add the lifecycle events.
     */
    new LocalePlugin({
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
    new LocaleStorageTransformPlugin({
        toStorage: async ({ locale }) => {
            const value = locale.richText;
            return {
                ...locale,
                richText: jsonpack.pack(value)
            };
        },
        fromStorage: async ({ locale }) => {
            const value = locale.richText;
            return {
                ...locale,
                richText: value ? jsonpack.unpack(value) : null
            };
        }
    })
];
