import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { ModelBuilderFeature } from "~/features/modelBuilder/feature.js";
import { ModelFactory, ModelsProvider } from "~/features/modelBuilder/index.js";

const SETTINGS_MODEL_ID = "storeSettings";

describe("Tabs Field Type", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    it("should hoist child fields and inject layout descriptor for public model", async () => {
        class SettingsModelImpl implements ModelFactory.Interface {
            async execute(builder: ModelFactory.Builder) {
                return [
                    builder
                        .public({
                            modelId: SETTINGS_MODEL_ID,
                            name: "Store Settings",
                            group: "ungrouped"
                        })
                        .description("Settings for our e-commerce store")
                        .fields(fields => ({
                            settings: fields
                                .uiTabs()
                                .label("My Tabs")
                                .tab("general", {
                                    name: "General",
                                    fields: f => ({
                                        title: f.text().label("Title"),
                                        slug: f.text().label("Slug")
                                    }),
                                    layout: [["title"], ["slug"]]
                                })
                                .tab("seo", {
                                    name: "SEO",
                                    fields: f => ({
                                        metaTitle: f.text().label("Meta Title")
                                    }),
                                    layout: [["metaTitle"]]
                                })
                        }))
                        .layout([["settings"]])
                        .singularApiName("StoreSettings")
                        .pluralApiName("StoreSettings")
                ];
            }
        }

        container.registerInstance(ModelFactory, new SettingsModelImpl());

        const modelsProvider = container.resolve(ModelsProvider);
        const models = await modelsProvider.list("root");
        const model = models.find(m => m.modelId === SETTINGS_MODEL_ID);

        expect(model).toBeDefined();
        expect(model!.modelId).toBe(SETTINGS_MODEL_ID);
        expect(model!.name).toBe("Store Settings");
        expect(model!.description).toBe("Settings for our e-commerce store");

        // Tabs field itself should NOT be in model.fields
        const tabsField = model!.fields.find(f => f.fieldId === "settings");
        expect(tabsField).toBeUndefined();

        // Child fields should be hoisted to model.fields
        const titleField = model!.fields.find(f => f.fieldId === "title");
        expect(titleField).toBeDefined();
        expect(titleField!.type).toBe("text");
        expect(titleField!.label).toBe("Title");

        const slugField = model!.fields.find(f => f.fieldId === "slug");
        expect(slugField).toBeDefined();
        expect(slugField!.type).toBe("text");
        expect(slugField!.label).toBe("Slug");

        const metaTitleField = model!.fields.find(f => f.fieldId === "metaTitle");
        expect(metaTitleField).toBeDefined();
        expect(metaTitleField!.type).toBe("text");
        expect(metaTitleField!.label).toBe("Meta Title");

        // Layout should contain a rich descriptor instead of the "settings" string
        expect(model!.layout).toEqual([
            [
                {
                    type: "tabs",
                    label: "My Tabs",
                    description: null,
                    help: null,
                    tabs: [
                        {
                            id: "general",
                            label: "General",
                            icon: null,
                            layout: [["title"], ["slug"]]
                        },
                        {
                            id: "seo",
                            label: "SEO",
                            icon: null,
                            layout: [["metaTitle"]]
                        }
                    ]
                }
            ]
        ]);
    });

    it("should support tabs with icons and descriptions", async () => {
        class TabsWithMetadataModel implements ModelFactory.Interface {
            async execute(builder: ModelFactory.Builder) {
                return [
                    builder
                        .private({
                            modelId: "tabsWithMetadata",
                            name: "Tabs With Metadata"
                        })
                        .fields(fields => ({
                            content: fields
                                .uiTabs()
                                .label("Content Tabs")
                                .tab("info", {
                                    name: "Info",
                                    icon: { type: "icon", name: "fas/info-circle" },
                                    description: "General information tab",
                                    fields: f => ({
                                        name: f.text().label("Name")
                                    })
                                })
                        }))
                ];
            }
        }

        container.registerInstance(ModelFactory, new TabsWithMetadataModel());

        const modelsProvider = container.resolve(ModelsProvider);
        const models = await modelsProvider.list("root");
        const model = models.find(m => m.modelId === "tabsWithMetadata");

        // Child fields should be hoisted
        const nameField = model!.fields.find(f => f.fieldId === "name");
        expect(nameField).toBeDefined();
        expect(nameField!.type).toBe("text");
        expect(nameField!.label).toBe("Name");

        // Tabs field itself should NOT be in fields
        const contentField = model!.fields.find(f => f.fieldId === "content");
        expect(contentField).toBeUndefined();
    });

    it("should make list() a no-op for tabs field", async () => {
        class TabsListModel implements ModelFactory.Interface {
            async execute(builder: ModelFactory.Builder) {
                return [
                    builder
                        .private({
                            modelId: "tabsList",
                            name: "Tabs List"
                        })
                        .fields(fields => ({
                            myTabs: fields
                                .uiTabs()
                                .label("My Tabs")
                                .list() // should be a no-op
                                .tab("tab1", {
                                    name: "Tab 1",
                                    fields: f => ({
                                        value: f.text().label("Value")
                                    })
                                })
                        }))
                ];
            }
        }

        container.registerInstance(ModelFactory, new TabsListModel());

        const modelsProvider = container.resolve(ModelsProvider);
        const models = await modelsProvider.list("root");
        const model = models.find(m => m.modelId === "tabsList");

        // Child field should be hoisted
        const valueField = model!.fields.find(f => f.fieldId === "value");
        expect(valueField).toBeDefined();

        // Tabs field should NOT be in fields
        const tabsField = model!.fields.find(f => f.fieldId === "myTabs");
        expect(tabsField).toBeUndefined();
    });

    it("should support tabs with nested object fields", async () => {
        class TabsWithObjectModel implements ModelFactory.Interface {
            async execute(builder: ModelFactory.Builder) {
                return [
                    builder
                        .private({
                            modelId: "tabsWithObject",
                            name: "Tabs With Object"
                        })
                        .fields(fields => ({
                            page: fields
                                .uiTabs()
                                .label("Page Settings")
                                .tab("content", {
                                    name: "Content",
                                    fields: f => ({
                                        title: f.text().label("Title"),
                                        body: f.richText().label("Body")
                                    }),
                                    layout: [["title"], ["body"]]
                                })
                                .tab("meta", {
                                    name: "Meta",
                                    fields: f => ({
                                        seo: f
                                            .object()
                                            .label("SEO")
                                            .fields(of => ({
                                                metaTitle: of.text().label("Meta Title"),
                                                metaDescription: of
                                                    .longText()
                                                    .label("Meta Description")
                                            }))
                                            .layout([["metaTitle"], ["metaDescription"]])
                                    })
                                })
                        }))
                ];
            }
        }

        container.registerInstance(ModelFactory, new TabsWithObjectModel());

        const modelsProvider = container.resolve(ModelsProvider);
        const models = await modelsProvider.list("root");
        const model = models.find(m => m.modelId === "tabsWithObject");

        // All child fields should be hoisted
        const titleField = model!.fields.find(f => f.fieldId === "title");
        expect(titleField).toBeDefined();
        expect(titleField!.type).toBe("text");

        const bodyField = model!.fields.find(f => f.fieldId === "body");
        expect(bodyField).toBeDefined();
        expect(bodyField!.type).toBe("rich-text");

        // Object field should be hoisted with its nested structure intact
        const seoField = model!.fields.find(f => f.fieldId === "seo");
        expect(seoField).toBeDefined();
        expect(seoField!.type).toBe("object");
        expect(seoField!.settings.fields).toHaveLength(2);
        expect(seoField!.settings.layout).toEqual([["metaTitle"], ["metaDescription"]]);

        // Tabs field itself should NOT be in fields
        const pageField = model!.fields.find(f => f.fieldId === "page");
        expect(pageField).toBeUndefined();
    });
});
