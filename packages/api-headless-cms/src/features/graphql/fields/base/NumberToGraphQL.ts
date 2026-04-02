import { CmsModelFieldToGraphQL } from "../abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelFieldType } from "~/types/modelField.js";
import { createGraphQLInputField } from "~/graphqlFields/helpers.js";

const createListFilters = (fieldId: string): string => {
    return `
        ${fieldId}: Number
        ${fieldId}_not: Number
        ${fieldId}_in: [Number]
        ${fieldId}_not_in: [Number]
        ${fieldId}_lt: Number
        ${fieldId}_lte: Number
        ${fieldId}_gt: Number
        ${fieldId}_gte: Number
        # there must be two numbers sent in the array
        ${fieldId}_between: [Number!]
        # there must be two numbers sent in the array
        ${fieldId}_not_between: [Number!]
    `;
};

class ReadApi implements CmsModelFieldToGraphQL.ReadApi {
    public createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        if (field.list) {
            return `${field.fieldId}: [Number]`;
        }
        return `${field.fieldId}: Number`;
    }

    public createGetFilters({ field }: CmsModelFieldToGraphQL.GetFiltersParams): string {
        return `${field.fieldId}: Number`;
    }

    public createListFilters({ field }: CmsModelFieldToGraphQL.ListFiltersParams): string {
        return createListFilters(field.fieldId);
    }
}

class ManageApi extends ReadApi implements CmsModelFieldToGraphQL.ManageApi {
    public createInputField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        return createGraphQLInputField(field, "Number");
    }
}

class NumberToGraphQL implements CmsModelFieldToGraphQL.Interface {
    private readonly read = new ReadApi();
    private readonly manage = new ManageApi();

    public getFieldType(): CmsModelFieldType {
        return "number";
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

export const NumberFieldToGraphQL = CmsModelFieldToGraphQL.createImplementation({
    implementation: NumberToGraphQL,
    dependencies: []
});
