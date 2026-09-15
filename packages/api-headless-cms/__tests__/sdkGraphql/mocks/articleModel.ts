import type { TestCmsModel } from "../../types";
import type { CmsGroup } from "~/types";
import { createModelField } from "~/utils/createModelField.js";

export const createArticleModel = (group: CmsGroup): TestCmsModel => {
    return {
        modelId: "article",
        singularApiName: "Article",
        pluralApiName: "Articles",
        group: group.slug,
        name: "Article",
        description: "Articles with dynamic zone content",
        titleFieldId: "title",
        icon: { type: "fas", name: "newspaper" },
        fields: [
            createModelField({
                id: "title",
                storageId: "text@title",
                fieldId: "title",
                type: "text",
                label: "Title",
                validation: [
                    {
                        name: "required",
                        message: "Title is required"
                    }
                ],
                settings: {}
            }),
            createModelField({
                id: "content",
                storageId: "dynamicZone@content",
                fieldId: "content",
                type: "dynamicZone",
                label: "Content",
                list: true,
                validation: [],
                settings: {
                    templates: [
                        {
                            name: "Hero",
                            gqlTypeName: "Hero",
                            icon: {
                                type: "icon",
                                name: "fas/flag"
                            },
                            description: "Hero section",
                            id: "heroTemplateId",
                            fields: [
                                createModelField({
                                    id: "title",
                                    fieldId: "title",
                                    label: "Title",
                                    type: "text"
                                })
                            ],
                            layout: [["title"]],
                            validation: []
                        },
                        {
                            name: "Simple Text",
                            gqlTypeName: "SimpleText",
                            icon: {
                                type: "icon",
                                name: "fas/file-text"
                            },
                            description: "Simple text block",
                            id: "simpleTextTemplateId",
                            fields: [
                                createModelField({
                                    id: "text",
                                    fieldId: "text",
                                    label: "Text",
                                    type: "long-text"
                                })
                            ],
                            layout: [["text"]],
                            validation: []
                        }
                    ]
                }
            })
        ],
        layout: [["title"], ["content"]]
    };
};
