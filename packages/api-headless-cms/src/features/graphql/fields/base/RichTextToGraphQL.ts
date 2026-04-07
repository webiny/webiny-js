import { CmsModelFieldToGraphQL } from "../abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelFieldType } from "~/types/modelField.js";
import { createGraphQLInputField } from "./utils/createGraphQLInputField.js";
import { createRichTextResolver } from "./richText/richTextResolver.js";

class ReadApi implements CmsModelFieldToGraphQL.ReadApi {
    public createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        if (field.list) {
            return `${field.fieldId}(format: String): [JSON]`;
        }
        return `${field.fieldId}(format: String): JSON`;
    }

    public createGetFilters({ field }: CmsModelFieldToGraphQL.GetFiltersParams): string {
        return `${field.fieldId}: JSON`;
    }

    public createResolver({
        field
    }: CmsModelFieldToGraphQL.ResolverParams): CmsModelFieldToGraphQL.Resolver {
        return createRichTextResolver(field);
    }
}

class ManageApi implements CmsModelFieldToGraphQL.ManageApi {
    public createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        if (field.list) {
            return `${field.fieldId}: [JSON]`;
        }
        return `${field.fieldId}: JSON`;
    }

    public createInputField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        return createGraphQLInputField(field, "JSON");
    }
}

class RichTextToGraphQL implements CmsModelFieldToGraphQL.Interface {
    public readonly read = new ReadApi();
    public readonly manage = new ManageApi();

    public readonly fieldType: CmsModelFieldType = "rich-text";
    public readonly isSearchable: boolean = false;
    public readonly isSortable: boolean = false;
    public readonly isFullTextSearchable: boolean = false;

    public getReadApi(): CmsModelFieldToGraphQL.ReadApi {
        return this.read;
    }

    public getManageApi(): CmsModelFieldToGraphQL.ManageApi {
        return this.manage;
    }
}

export const RichTextFieldToGraphQL = CmsModelFieldToGraphQL.createImplementation({
    implementation: RichTextToGraphQL,
    dependencies: []
});
