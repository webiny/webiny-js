import { createModelGroupPlugin, createModelPlugin } from "@webiny/api-headless-cms";

const group = {
    id: "recordLockingGroup",
    name: "Record Locking Group"
};

const createTestModel = (modelId: string, name: string) => {
    return createModelPlugin({
        modelId,
        name,
        icon: {
            name: "fa/fas",
            type: "font-awesome"
        },
        description: "",
        fields: [
            {
                id: "title",
                fieldId: "title",
                storageId: "text@title",
                type: "text",
                label: "Title",
                validation: [],
                listValidation: []
            }
        ],
        group: group.id,
        singularApiName: name.replace(/\s/g, ""),
        pluralApiName: `${name.replace(/\s/g, "")}s`,
        layout: [["title"]],
        titleFieldId: "title"
    } as any);
};

export const AUTHOR_MODEL_ID = "author";
export const SECRET_MODEL_ID = "secretArticle";

/**
 * Lock record types point to CMS models, so the tests need real models to lock entries of.
 */
export const createTestModelPlugins = () => {
    return [
        createModelGroupPlugin({
            ...group,
            slug: "record-locking-group",
            description: null,
            icon: {
                name: "fa/fas",
                type: "font-awesome"
            }
        }),
        createTestModel(AUTHOR_MODEL_ID, "Author"),
        createTestModel(SECRET_MODEL_ID, "Secret Article")
    ];
};
