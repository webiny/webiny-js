import { CmsModelFieldToGraphQL } from "../abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelFieldType } from "~/types/modelField.js";
import { createGraphQLInputField } from "~/graphqlFields/helpers.js";

const createListFilters = (fieldId: string): string => {
    return `
        ${fieldId}: String
        ${fieldId}_not: String
        ${fieldId}_in: [String]
        ${fieldId}_not_in: [String]
        ${fieldId}_contains: String
        ${fieldId}_not_contains: String
        ${fieldId}_startsWith: String
        ${fieldId}_not_startsWith: String
    `;
};

class ReadApi implements CmsModelFieldToGraphQL.ReadApi {
    public createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        if (field.list) {
            return `${field.fieldId}: [String]`;
        }
        return `${field.fieldId}: String`;
    }

    public createGetFilters({ field }: CmsModelFieldToGraphQL.GetFiltersParams): string {
        return `${field.fieldId}: String`;
    }

    public createListFilters({ field }: CmsModelFieldToGraphQL.ListFiltersParams): string {
        return createListFilters(field.fieldId);
    }
}

class ManageApi extends ReadApi implements CmsModelFieldToGraphQL.ManageApi {
    public createInputField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        return createGraphQLInputField(field, "String");
    }
}

class TextToGraphQL implements CmsModelFieldToGraphQL.Interface {
    private readonly read = new ReadApi();
    private readonly manage = new ManageApi();

    public getFieldType(): CmsModelFieldType {
        return "text";
    }

    public getIsSearchable(): boolean {
        return true;
    }

    public getIsSortable(): boolean {
        return true;
    }

    public getIsFullTextSearchable(): boolean {
        return true;
    }

    public getRead(): CmsModelFieldToGraphQL.ReadApi {
        return this.read;
    }

    public getManage(): CmsModelFieldToGraphQL.ManageApi {
        return this.manage;
    }
}

export const TextFieldToGraphQL = CmsModelFieldToGraphQL.createImplementation({
    implementation: TextToGraphQL,
    dependencies: []
});
