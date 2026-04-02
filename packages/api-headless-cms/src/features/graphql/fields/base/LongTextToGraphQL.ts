import { CmsModelFieldToGraphQL } from "../abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelFieldType } from "~/types/modelField.js";
import { createGraphQLInputField } from "~/graphqlFields/helpers.js";

const createListFilters = (fieldId: string): string => {
    return `
        ${fieldId}_contains: String
        ${fieldId}_not_contains: String
    `;
};

class ReadApi implements CmsModelFieldToGraphQL.ReadApi {
    public createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        if (field.list) {
            return `${field.fieldId}: [String]`;
        }
        return `${field.fieldId}: String`;
    }

    public createListFilters({ field }: CmsModelFieldToGraphQL.ListFiltersParams): string {
        return createListFilters(field.fieldId);
    }

    public createResolver({
        field
    }: CmsModelFieldToGraphQL.ResolverParams): CmsModelFieldToGraphQL.Resolver {
        return async (parent: any) => {
            return parent[field.fieldId] || null;
        };
    }
}

class ManageApi extends ReadApi implements CmsModelFieldToGraphQL.ManageApi {
    public createInputField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        return createGraphQLInputField(field, "String");
    }
}

class LongTextToGraphQL implements CmsModelFieldToGraphQL.Interface {
    private readonly read = new ReadApi();
    private readonly manage = new ManageApi();

    public getFieldType(): CmsModelFieldType {
        return "long-text";
    }

    public getIsSearchable(): boolean {
        return true;
    }

    public getIsSortable(): boolean {
        return false;
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

export const LongTextFieldToGraphQL = CmsModelFieldToGraphQL.createImplementation({
    implementation: LongTextToGraphQL,
    dependencies: []
});
