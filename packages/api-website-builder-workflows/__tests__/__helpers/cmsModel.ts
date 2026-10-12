import { createModelGroupPlugin, createModelPlugin } from "@webiny/api-headless-cms";

/**
 * A public CMS model next to the pages, so WB tests can store a Headless CMS workflow and prove the
 * WB wrappers never touch it (R46).
 */
export const ARTICLE_NAMESPACE = "cms.article";

const group = {
    id: "default",
    name: "Default",
    description: "",
    slug: "default",
    icon: { name: "fa/fas", type: "fa/fas" }
};

const article = {
    modelId: "article",
    name: "Article",
    group: group.slug,
    titleFieldId: "title",
    description: "",
    icon: null,
    singularApiName: "Article",
    pluralApiName: "Articles",
    layout: [["title"]],
    fields: [
        {
            id: "title",
            storageId: "text@title",
            fieldId: "title",
            type: "text",
            label: "Title",
            validation: [],
            listValidation: []
        }
    ]
};

export const createArticleModelPlugins = () => {
    return [createModelPlugin(article), createModelGroupPlugin(group)];
};
