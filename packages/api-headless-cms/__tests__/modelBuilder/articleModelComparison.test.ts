import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { ModelBuilderFeature } from "~/features/modelBuilder/feature.js";
import {
    PrivateModel,
    PrivateModelProvider,
    type IPrivateModelBuilder
} from "~/features/modelBuilder/index.js";
import { createCmsModel } from "@webiny/api-headless-cms";
import { articleModel } from "../contentTraverser/mocks/article.model.js";

describe("Article Model Builder Comparison", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    describe("Complex Article Model", () => {
        it("should produce identical output for article model with dynamic zones", async () => {
            // ============================================
            // OLD WAY - imported from existing test mocks
            // ============================================
            const oldModel = createCmsModel(articleModel).contentModel;

            // ============================================
            // NEW WAY - Using builder API via DI
            // ============================================
            class ArticleModelImpl implements PrivateModel.Interface {
                buildModel(builder: IPrivateModelBuilder): IPrivateModelBuilder {
                    return builder
                        .modelId("article")
                        .name("Article")
                        .titleFieldId("title")
                        .fields(fields => ({
                            title: fields
                                .text()
                                .fieldId("title")
                                .storageId("text@title")
                                .label("Title"),
                            body: fields
                                .richText()
                                .fieldId("body")
                                .storageId("rich-text@body")
                                .label("Body"),
                            categories: fields
                                .ref()
                                .fieldId("categories")
                                .storageId("ref@categories")
                                .label("Categories")
                                .multipleValues(true)
                                .models([{ modelId: "category" }]),
                            content: fields
                                .dynamicZone()
                                .fieldId("content")
                                .storageId("dynamicZone@content")
                                .label("Content")
                                .multipleValues(true)
                                .rawTemplates([
                                    {
                                        name: "Hero #1",
                                        gqlTypeName: "Hero",
                                        icon: "fas/flag",
                                        description: "The top piece of content on every page.",
                                        id: "cv2zf965v324ivdc7e1vt",
                                        fields: [
                                            {
                                                id: "title",
                                                fieldId: "title",
                                                label: "Title",
                                                type: "text"
                                            }
                                        ]
                                    },
                                    {
                                        name: "Simple Text #1",
                                        gqlTypeName: "SimpleText",
                                        icon: "fas/file-text",
                                        description: "Simple paragraph of text.",
                                        id: "81qiz2v453wx9uque0gox",
                                        fields: [
                                            {
                                                id: "text",
                                                fieldId: "text",
                                                label: "Text",
                                                type: "long-text"
                                            }
                                        ]
                                    },
                                    {
                                        name: "Settings",
                                        gqlTypeName: "Settings",
                                        icon: "fas/file-text",
                                        description: "Settings",
                                        id: "9ht43gurhegkbdfsaafyads",
                                        fields: [
                                            {
                                                id: "settings",
                                                fieldId: "settings",
                                                label: "Settings",
                                                type: "object",
                                                settings: {
                                                    fields: [
                                                        {
                                                            id: "title",
                                                            fieldId: "title",
                                                            type: "text",
                                                            label: "Title"
                                                        },
                                                        {
                                                            id: "seo",
                                                            fieldId: "seo",
                                                            type: "object",
                                                            label: "SEO",
                                                            multipleValues: true,
                                                            settings: {
                                                                fields: [
                                                                    {
                                                                        id: "title",
                                                                        fieldId: "title",
                                                                        type: "text",
                                                                        label: "Title"
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                type: "dynamicZone",
                                                settings: {
                                                    templates: [
                                                        {
                                                            name: "Ad",
                                                            gqlTypeName: "Ad",
                                                            icon: "fab/buysellads",
                                                            description: "Ad",
                                                            id: "0emukbsvmzpozx2lzk883",
                                                            fields: [
                                                                {
                                                                    type: "ref",
                                                                    settings: {
                                                                        models: [
                                                                            {
                                                                                modelId: "author"
                                                                            }
                                                                        ]
                                                                    },
                                                                    multipleValues: true,
                                                                    label: "Authors",
                                                                    fieldId: "authors",
                                                                    id: "tuuehcqp"
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                label: "DynamicZone",
                                                fieldId: "dynamicZone",
                                                id: "nli9u1rm"
                                            },
                                            {
                                                type: "dynamicZone",
                                                settings: {
                                                    templates: []
                                                },
                                                label: "DynamicZone",
                                                fieldId: "emptyDynamicZone",
                                                id: "lsd78slxc8"
                                            }
                                        ]
                                    }
                                ])
                        }));
                }
            }

            // Register the model implementation
            container.registerInstance(PrivateModel, new ArticleModelImpl());

            // Resolve the provider AFTER registering the model
            const privateModelProvider = container.resolve(PrivateModelProvider);

            // Get models via provider
            const models = await privateModelProvider.getModels();
            const newModel = models.find(m => m.modelId === "article");

            // ============================================
            // COMPARISON
            // ============================================
            expect(newModel).toBeDefined();

            // Compare the essential properties
            expect(newModel!.modelId).toBe(oldModel.modelId);
            expect(newModel!.name).toBe(oldModel.name);
            expect(newModel!.fields.length).toBe(oldModel.fields.length);

            // Compare full JSON output - should be identical
            const oldModelJson = JSON.parse(JSON.stringify(oldModel));
            const newModelJson = JSON.parse(JSON.stringify(newModel));

            expect(newModelJson).toEqual(oldModelJson);
        });
    });
});
