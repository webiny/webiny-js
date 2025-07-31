import { createModelPlugin } from "~/index.js";
import type { CmsModelGroup } from "~/types/index.js";
import { createDefaultGroup } from "~tests/__helpers/groups/defaultGroup.js";

export interface ICreateAuthorWithSearchableJsonParams {
    group?: Pick<CmsModelGroup, "id" | "name">;
    // model?: Partial<CmsModelInput>;
}

export interface IAuthorWithSearchableJsonCmsEntryValues {
    name: string;
    info: Record<string, any>;
}

export const AUTHOR_WITH_SEARCHABLE_JSON_MODEL_ID = "authorWithSearchableJson";

export const createAuthorWithSearchableJson = (params?: ICreateAuthorWithSearchableJsonParams) => {
    const group = params?.group || createDefaultGroup().contentModelGroup;

    return createModelPlugin({
        modelId: AUTHOR_WITH_SEARCHABLE_JSON_MODEL_ID,
        name: "Author with Searchable JSON",
        titleFieldId: "name",
        description: "Author model with searchable JSON field.",
        layout: [["name"], ["info"], ["nonSearchableJson"]],
        fields: [
            {
                id: "name",
                storageId: "text@name",
                fieldId: "name",
                type: "text",
                label: "Name",
                multipleValues: false
            },
            {
                id: "info",
                storageId: "searchable-json@info",
                fieldId: "info",
                type: "searchable-json",
                label: "Info",
                multipleValues: false
            },
            {
                id: "nonSearchableJson",
                storageId: "json@nonSearchableJson",
                fieldId: "nonSearchableJson",
                type: "json",
                label: "Non Searchable JSON",
                multipleValues: false
            }
        ],
        group
    });
};
