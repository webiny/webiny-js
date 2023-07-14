import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

const createFilters = (field: CmsModelField) => {
    return [
        `${field.fieldId}: AcoLocationInput`,
        `${field.fieldId}_in: [AcoLocationInput!]`,
        `${field.fieldId}_not_in: [AcoLocationInput!]`
    ].join("\n");
};
export const createLocationField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        type: "cms-model-field-to-graphql",
        name: "cms-model-field-to-graphql-location",
        fieldType: "location",
        isSortable: false,
        isSearchable: true,
        read: {
            createGetFilters({ field }): string {
                return createFilters(field);
            },
            createListFilters({ field }): string {
                return createFilters(field);
            },
            createTypeField(): string {
                return ``;
            }
        },
        manage: {
            createTypeField(): string {
                return ``;
            },
            createInputField({ field }): string {
                return `${field.fieldId}: AcoLocationInput`;
            }
        }
    };
};
