import { CmsModelFieldToGraphQLPlugin } from "~/types";
import { createGraphQLInputField } from "./helpers";
import { createRichTextResolver } from "~/graphqlFields/richText/richTextResolver";

export const createRichTextField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-rich-text",
        type: "cms-model-field-to-graphql",
        fieldType: "rich-text",
        isSortable: false,
        isSearchable: false,
        read: {
            createTypeField({ field }) {
                if (field.multipleValues) {
                    return `${field.fieldId}(format: String): [JSON]`;
                }

                return `${field.fieldId}(format: String): JSON`;
            },
            createGetFilters({ field }) {
                return `${field.fieldId}: JSON`;
            },
            createResolver({ field }) {
                return createRichTextResolver(field);
            }
        },
        manage: {
            createTypeField({ field }) {
                if (field.multipleValues) {
                    return `${field.fieldId}: [JSON]`;
                }
                return `${field.fieldId}: JSON`;
            },
            createInputField({ field }) {
                return createGraphQLInputField(field, "JSON");
            }
        }
    };
};
