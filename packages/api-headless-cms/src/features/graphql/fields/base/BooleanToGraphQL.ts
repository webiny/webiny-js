import { CmsModelFieldToGraphQL } from "../abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelFieldType } from "~/types/modelField.js";
import { createGraphQLInputField } from "~/graphqlFields/helpers.js";

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

class ManageApi extends ReadApi implements CmsModelFieldToGraphQL.ManageApi {
    public createInputField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        return createGraphQLInputField(field, "Boolean");
    }
}

class BooleanToGraphQL implements CmsModelFieldToGraphQL.Interface {
    private readonly read = new ReadApi();
    private readonly manage = new ManageApi();

    public getFieldType(): CmsModelFieldType {
        return "boolean";
    }

    public getIsSearchable(): boolean {
        return true;
    }

    public getIsSortable(): boolean {
        return true;
    }

    public getIsFullTextSearchable(): boolean {
        return false;
    }

    public getRead(): CmsModelFieldToGraphQL.ReadApi {
        return this.read;
    }

    public getManage(): CmsModelFieldToGraphQL.ManageApi {
        return this.manage;
    }
}

export const BooleanFieldToGraphQL = CmsModelFieldToGraphQL.createImplementation({
    implementation: BooleanToGraphQL,
    dependencies: []
});
