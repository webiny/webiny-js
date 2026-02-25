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

    it("should build a model with a tabs field containing nested fields", async () => {
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
                                .tabs()
                                .label("My Tabs")
                                .tab("general", {
                                    name: "General",
                                    fields: f => ({
                                        title: f.text().label("Title"),
                                        slug: f.text().label("Slug")
                                    })
                                })
                                .tab("seo", {
                                    name: "SEO",
                                    fields: f => ({
                                        metaTitle: f.text().label("Meta Title")
                                    })
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

        // Find the tabs field
        const settingsField = model!.fields.find(f => f.fieldId === "settings");
        expect(settingsField).toBeDefined();
        expect(settingsField!.type).toBe("ui");
        expect(settingsField!.label).toBe("My Tabs");
        expect(settingsField!.renderer?.name).toBe("tabs");
        expect(settingsField!.list).toBe(false);

        // Verify tabs in settings
        const tabs = settingsField!.settings?.tabs;
        expect(tabs).toBeDefined();
        expect(tabs).toHaveLength(2);

        // Verify "general" tab
        const generalTab = tabs[0];
        expect(generalTab.id).toBe("general");
        expect(generalTab.name).toBe("General");
        expect(generalTab.description).toBe("");
        expect(generalTab.fields).toHaveLength(2);

        const titleField = generalTab.fields.find((f: any) => f.fieldId === "title");
        expect(titleField).toBeDefined();
        expect(titleField.type).toBe("text");
        expect(titleField.label).toBe("Title");

        const slugField = generalTab.fields.find((f: any) => f.fieldId === "slug");
        expect(slugField).toBeDefined();
        expect(slugField.type).toBe("text");
        expect(slugField.label).toBe("Slug");

        // Verify "seo" tab
        const seoTab = tabs[1];
        expect(seoTab.id).toBe("seo");
        expect(seoTab.name).toBe("SEO");
        expect(seoTab.fields).toHaveLength(1);

        const metaTitleField = seoTab.fields.find((f: any) => f.fieldId === "metaTitle");
        expect(metaTitleField).toBeDefined();
        expect(metaTitleField.type).toBe("text");
        expect(metaTitleField.label).toBe("Meta Title");
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
                                .tabs()
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

        const contentField = model!.fields.find(f => f.fieldId === "content");
        const tabs = contentField!.settings?.tabs;

        expect(tabs[0].icon).toEqual({ type: "icon", name: "fas/info-circle" });
        expect(tabs[0].description).toBe("General information tab");
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
                                .tabs()
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

        const tabsField = model!.fields.find(f => f.fieldId === "myTabs");
        expect(tabsField!.list).toBe(false);
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
                                .tabs()
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

        const pageField = model!.fields.find(f => f.fieldId === "page");
        const tabs = pageField!.settings?.tabs;

        // Verify content tab has layout
        expect(tabs[0].layout).toEqual([["title"], ["body"]]);

        // Verify meta tab has nested object
        const seoField = tabs[1].fields.find((f: any) => f.fieldId === "seo");
        expect(seoField.type).toBe("object");
        expect(seoField.settings.fields).toHaveLength(2);
        expect(seoField.settings.layout).toEqual([["metaTitle"], ["metaDescription"]]);
    });
});
