import { CmsModelFieldToGraphQL } from "../abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelFieldType } from "~/types/modelField.js";
import { createGraphQLInputField } from "./utils/createGraphQLInputField.js";

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
    public readonly read = new ReadApi();
    public readonly manage = new ManageApi();

    public readonly fieldType: CmsModelFieldType = "file";
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

export const FileFieldToGraphQL = CmsModelFieldToGraphQL.createImplementation({
    implementation: FileToGraphQL,
    dependencies: []
});
