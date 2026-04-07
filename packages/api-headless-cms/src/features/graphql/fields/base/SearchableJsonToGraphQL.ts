import { CmsModelFieldToGraphQL } from "../abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelFieldType } from "~/types/modelField.js";
import { createGraphQLInputField } from "./utils/createGraphQLInputField.js";

class ReadApi implements CmsModelFieldToGraphQL.ReadApi {
    public createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        if (field.list) {
            return `${field.fieldId}: [JSON]`;
        }
        return `${field.fieldId}: JSON`;
    }

    public createGetFilters({ field }: CmsModelFieldToGraphQL.GetFiltersParams): string {
        return `${field.fieldId}: JSON`;
    }

    public createListFilters({ field }: CmsModelFieldToGraphQL.ListFiltersParams): string {
        return `${field.fieldId}: JSON`;
    }
}

class ManageApi implements CmsModelFieldToGraphQL.ManageApi {
    public createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        if (field.list) {
            return `${field.fieldId}: [JSON]`;
        }
        return `${field.fieldId}: JSON`;
    }

    public createListFilters({ field }: CmsModelFieldToGraphQL.ListFiltersParams): string {
        return `${field.fieldId}: JSON`;
    }

    public createInputField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        return createGraphQLInputField(field, "JSON");
    }
}

class SearchableJsonToGraphQL implements CmsModelFieldToGraphQL.Interface {
    public readonly read = new ReadApi();
    public readonly manage = new ManageApi();

    public readonly fieldType: CmsModelFieldType = "searchable-json";
    public readonly isSearchable: boolean = true;
    public readonly isSortable: boolean = true;
    public readonly isFullTextSearchable: boolean = true;

    public getReadApi(): CmsModelFieldToGraphQL.ReadApi {
        return this.read;
    }

    public getManageApi(): CmsModelFieldToGraphQL.ManageApi {
        return this.manage;
    }
}

export const SearchableJsonFieldToGraphQL = CmsModelFieldToGraphQL.createImplementation({
    implementation: SearchableJsonToGraphQL,
    dependencies: []
});
