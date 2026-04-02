import { CmsModelFieldToGraphQL } from "../abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelFieldType } from "~/types/modelField.js";
import { createGraphQLInputField } from "~/graphqlFields/helpers.js";

class ReadApi implements CmsModelFieldToGraphQL.ReadApi {
    public createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        if (field.list) {
            return `${field.fieldId}: [String]`;
        }
        return `${field.fieldId}: String`;
    }
}

class ManageApi extends ReadApi implements CmsModelFieldToGraphQL.ManageApi {
    public createInputField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        return createGraphQLInputField(field, "String");
    }
}

class FileToGraphQL implements CmsModelFieldToGraphQL.Interface {
    private readonly read = new ReadApi();
    private readonly manage = new ManageApi();

    public getFieldType(): CmsModelFieldType {
        return "file";
    }

    public getIsSearchable(): boolean {
        return false;
    }

    public getIsSortable(): boolean {
        return false;
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

export const FileFieldToGraphQL = CmsModelFieldToGraphQL.createImplementation({
    implementation: FileToGraphQL,
    dependencies: []
});
