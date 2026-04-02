import { CmsModelFieldToGraphQL } from "../abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelFieldType } from "~/types/modelField.js";
import { createGraphQLInputField } from "./utils/createGraphQLInputField.js";

const createListFilters = (fieldId: string): string => {
    return `
        ${fieldId}: Boolean
        ${fieldId}_not: Boolean
    `;
};

class ReadApi implements CmsModelFieldToGraphQL.ReadApi {
    public createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        if (field.list) {
            return `${field.fieldId}: [Boolean]`;
        }
        return `${field.fieldId}: Boolean`;
    }

    public createGetFilters({ field }: CmsModelFieldToGraphQL.GetFiltersParams): string {
        return `${field.fieldId}: Boolean`;
    }

    public createListFilters({ field }: CmsModelFieldToGraphQL.ListFiltersParams): string {
        return createListFilters(field.fieldId);
    }
}

class ManageApi implements CmsModelFieldToGraphQL.ManageApi {
    public createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        if (field.list) {
            return `${field.fieldId}: [Boolean]`;
        }
        return `${field.fieldId}: Boolean`;
    }

    public createListFilters({ field }: CmsModelFieldToGraphQL.ListFiltersParams): string {
        return createListFilters(field.fieldId);
    }

    public createInputField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        return createGraphQLInputField(field, "Boolean");
    }
}

class BooleanToGraphQL implements CmsModelFieldToGraphQL.Interface {
    private readonly read = new ReadApi();
    private readonly manage = new ManageApi();

    public readonly fieldType: CmsModelFieldType = "boolean";
    public readonly isSearchable: boolean = true;
    public readonly isSortable: boolean = true;
    public readonly isFullTextSearchable: boolean = false;

    public getReadApi(): CmsModelFieldToGraphQL.ReadApi {
        return this.read;
    }

    public getManageApi(): CmsModelFieldToGraphQL.ManageApi {
        return this.manage;
    }
}

export const BooleanFieldToGraphQL = CmsModelFieldToGraphQL.createImplementation({
    implementation: BooleanToGraphQL,
    dependencies: []
});
