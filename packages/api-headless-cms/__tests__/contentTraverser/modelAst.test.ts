import { useHandler } from "~tests/testHelpers/useHandler";
import { articleModel } from "./mocks/article.model";
import { CmsModelPlugin } from "~/plugins";
import { CmsModelAst } from "~/types";

describe("Model to AST", () => {
    it("should generate content model AST", async () => {
        const { handler, tenant } = useHandler({
            plugins: [new CmsModelPlugin(articleModel)]
        });

        const context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-webiny-cms-locale": "en-US",
                "x-tenant": tenant.id
            }
        });

        const modelAstConverter = context.cms.getModelToAstConverter();
        const model = await context.cms.getModel("article");

        if (!model) {
            throw new Error(`Missing "article" model!`);
        }

        const ast = modelAstConverter.toAst(model);

        expect(ast).toEqual({
            type: "root",
            children: [
                {
                    type: "field",
                    field: {
                        id: "title",
                        multipleValues: false,
                        label: "Title",
                        type: "text",
                        storageId: "text@title",
                        fieldId: "title"
                    },
                    children: []
                },
                {
                    type: "field",
                    field: {
                        id: "body",
                        multipleValues: false,
                        label: "Body",
                        type: "rich-text",
                        storageId: "rich-text@body",
                        fieldId: "body"
                    },
                    children: []
                },
                {
                    type: "field",
                    field: {
                        id: "categories",
                        multipleValues: true,
                        label: "Categories",
                        type: "ref",
                        storageId: "ref@categories",
                        fieldId: "categories",
                        settings: {
                            models: [{ modelId: "category" }]
                        }
                    },
                    children: []
                },
                {
                    type: "field",
                    field: {
                        id: "content",
                        fieldId: "content",
                        storageId: "dynamicZone@content",
                        type: "dynamicZone",
                        label: "Content",
                        multipleValues: true,
                        settings: {}
                    },
                    children: [
                        {
                            type: "collection",
                            collection: {
                                name: "Hero #1",
                                gqlTypeName: "Hero",
                                icon: "fas/flag",
                                description: "The top piece of content on every page.",
                                id: "cv2zf965v324ivdc7e1vt",
                                discriminator: "_templateId"
                            },
                            children: [
                                {
                                    type: "field",
                                    field: {
                                        id: "title",
                                        fieldId: "title",
                                        label: "Title",
                                        type: "text"
                                    },
                                    children: []
                                }
                            ]
                        },
                        {
                            type: "collection",
                            collection: {
                                name: "Simple Text #1",
                                gqlTypeName: "SimpleText",
                                icon: "fas/file-text",
                                description: "Simple paragraph of text.",
                                id: "81qiz2v453wx9uque0gox",
                                discriminator: "_templateId"
                            },
                            children: [
                                {
                                    type: "field",
                                    field: {
                                        id: "text",
                                        fieldId: "text",
                                        label: "Text",
                                        type: "long-text"
                                    },
                                    children: []
                                }
                            ]
                        },
                        {
                            type: "collection",
                            collection: {
                                description: "Settings",
                                gqlTypeName: "Settings",
                                icon: "fas/file-text",
                                id: "9ht43gurhegkbdfsaafyads",
                                name: "Settings",
                                discriminator: "_templateId"
                            },
                            children: [
                                {
                                    type: "field",
                                    field: {
                                        id: "settings",
                                        fieldId: "settings",
                                        label: "Settings",
                                        type: "object",
                                        settings: {}
                                    },
                                    children: [
                                        {
                                            type: "field",
                                            field: {
                                                id: "title",
                                                fieldId: "title",
                                                type: "text",
                                                label: "Title"
                                            },
                                            children: []
                                        },
                                        {
                                            type: "field",
                                            field: {
                                                id: "seo",
                                                fieldId: "seo",
                                                type: "object",
                                                label: "SEO",
                                                multipleValues: true,
                                                settings: {}
                                            },
                                            children: [
                                                {
                                                    type: "field",
                                                    field: {
                                                        id: "title",
                                                        fieldId: "title",
                                                        type: "text",
                                                        label: "Title"
                                                    },
                                                    children: []
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    type: "field",
                                    field: {
                                        id: "nli9u1rm",
                                        fieldId: "dynamicZone",
                                        label: "DynamicZone",
                                        type: "dynamicZone",
                                        settings: {}
                                    },
                                    children: [
                                        {
                                            type: "collection",
                                            collection: {
                                                name: "Ad",
                                                gqlTypeName: "Ad",
                                                icon: "fab/buysellads",
                                                description: "Ad",
                                                id: "0emukbsvmzpozx2lzk883",
                                                discriminator: "_templateId"
                                            },
                                            children: [
                                                {
                                                    type: "field",
                                                    field: {
                                                        id: "tuuehcqp",
                                                        fieldId: "authors",
                                                        label: "Authors",
                                                        type: "ref",
                                                        multipleValues: true,
                                                        settings: {
                                                            models: [
                                                                {
                                                                    modelId: "author"
                                                                }
                                                            ]
                                                        }
                                                    },
                                                    children: []
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    type: "field",
                                    field: {
                                        id: "lsd78slxc8",
                                        fieldId: "emptyDynamicZone",
                                        label: "DynamicZone",
                                        type: "dynamicZone",
                                        settings: {}
                                    },
                                    children: []
                                }
                            ]
                        }
                    ]
                }
            ]
        } as CmsModelAst);
    });
});
