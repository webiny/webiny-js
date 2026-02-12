import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { ModelBuilderFeature } from "~/features/modelBuilder/feature";
import { FieldBuilderRegistry } from "~/features/modelBuilder/fieldBuilder/abstractions";
import { ModelBuilder } from "~/features/modelBuilder/models/ModelBuilder";

describe("Object Field Extension", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    const createModel = () => {
        const registry = container.resolve(FieldBuilderRegistry);
        const builder = new ModelBuilder(registry);
        return builder.public({
            modelId: "testModel",
            name: "Test Model",
            group: "test"
        });
    };

    describe("extend() method", () => {
        it("should extend existing object field with new fields", () => {
            const model = createModel();

            // Initial model with theme object
            model.fields(fields => ({
                theme: fields
                    .object()
                    .label("Theme")
                    .fields(fields => ({
                        primaryColor: fields.text().label("Primary Color"),
                        font: fields.text().label("Font")
                    }))
                    .layout([["primaryColor"], ["font"]])
            }));

            // Extend the theme object
            model.fields(fields => ({
                theme: fields
                    .extend()
                    .object()
                    .fields(fields => ({
                        logoUrl: fields.text().label("Logo URL")
                    }))
                    .layout(layout => layout.addField("logoUrl", { after: "font" }))
            }));

            const result = model.build();
            const themeField = result.contentModel.fields.find(f => f.fieldId === "theme");

            expect(themeField).toBeDefined();
            expect(themeField?.settings?.fields).toHaveLength(3);
            expect(themeField?.settings?.fields?.map((f: any) => f.fieldId)).toEqual([
                "primaryColor",
                "font",
                "logoUrl"
            ]);
            expect(themeField?.settings?.layout).toEqual([["primaryColor"], ["font", "logoUrl"]]);
        });

        it("should replace field when redefining without .extend() flag", () => {
            const model = createModel();

            model.fields(fields => ({
                theme: fields
                    .object()
                    .label("Theme")
                    .fields(fields => ({
                        primaryColor: fields.text().label("Primary Color")
                    }))
                    .layout([["primaryColor"]])
            }));

            // Redefine theme without .extend() - should replace entirely
            model.fields(fields => ({
                theme: fields
                    .object()
                    .label("New Theme")
                    .fields(fields => ({
                        logoUrl: fields.text().label("Logo URL")
                    }))
                    .layout([["logoUrl"]])
            }));

            const result = model.build();
            const themeField = result.contentModel.fields.find(f => f.fieldId === "theme");

            expect(themeField).toBeDefined();
            expect(themeField?.label).toBe("New Theme");
            expect(themeField?.settings?.fields).toHaveLength(1);
            expect(themeField?.settings?.fields?.[0].fieldId).toBe("logoUrl");
            expect(themeField?.settings?.layout).toEqual([["logoUrl"]]);
        });

        it("should throw error when redefining with wrong field type", () => {
            const model = createModel();

            model.fields(fields => ({
                name: fields.text().label("Name")
            }));

            expect(() => {
                model.fields(fields => ({
                    name: fields
                        .extend()
                        .object()
                        .fields(fields => ({
                            value: fields.text()
                        }))
                }));
            }).toThrow('Cannot extend field "name": type mismatch');
        });

        it("should support multiple extensions of the same object field", () => {
            const model = createModel();

            model.fields(fields => ({
                theme: fields
                    .object()
                    .label("Theme")
                    .fields(fields => ({
                        primaryColor: fields.text().label("Primary Color")
                    }))
                    .layout([["primaryColor"]])
            }));

            // First extension
            model.fields(fields => ({
                theme: fields
                    .extend()
                    .object()
                    .fields(fields => ({
                        secondaryColor: fields.text().label("Secondary Color")
                    }))
                    .layout(layout => layout.addField("secondaryColor", { after: "primaryColor" }))
            }));

            // Second extension
            model.fields(fields => ({
                theme: fields
                    .extend()
                    .object()
                    .fields(fields => ({
                        font: fields.text().label("Font")
                    }))
                    .layout(layout => layout.addRow(["font"]))
            }));

            const result = model.build();
            const themeField = result.contentModel.fields.find(f => f.fieldId === "theme");

            expect(themeField?.settings?.fields).toHaveLength(3);
            expect(themeField?.settings?.fields?.map((f: any) => f.fieldId)).toEqual([
                "primaryColor",
                "secondaryColor",
                "font"
            ]);
            expect(themeField?.settings?.layout).toEqual([
                ["primaryColor", "secondaryColor"],
                ["font"]
            ]);
        });

        it("should correctly extend second object field when multiple exist", () => {
            const model = createModel();

            model.fields(fields => ({
                theme: fields
                    .object()
                    .label("Theme")
                    .fields(fields => ({
                        primaryColor: fields.text().label("Primary Color")
                    }))
                    .layout([["primaryColor"]]),
                settings: fields
                    .object()
                    .label("Settings")
                    .fields(fields => ({
                        enableNotifications: fields.text().label("Enable Notifications")
                    }))
                    .layout([["enableNotifications"]])
            }));

            // Extend the SECOND object field (settings, not theme)
            model.fields(fields => ({
                settings: fields
                    .extend()
                    .object()
                    .fields(fields => ({
                        emailFrequency: fields.text().label("Email Frequency")
                    }))
                    .layout(layout =>
                        layout.addField("emailFrequency", { after: "enableNotifications" })
                    )
            }));

            const result = model.build();
            const themeField = result.contentModel.fields.find(f => f.fieldId === "theme");
            const settingsField = result.contentModel.fields.find(f => f.fieldId === "settings");

            // Theme should be unchanged
            expect(themeField?.settings?.fields).toHaveLength(1);
            expect(themeField?.settings?.fields?.[0].fieldId).toBe("primaryColor");

            // Settings should have both fields
            expect(settingsField?.settings?.fields).toHaveLength(2);
            expect(settingsField?.settings?.fields?.map((f: any) => f.fieldId)).toEqual([
                "enableNotifications",
                "emailFrequency"
            ]);
            expect(settingsField?.settings?.layout).toEqual([
                ["enableNotifications", "emailFrequency"]
            ]);
        });

        it("should allow extending object field layout without adding new fields", () => {
            const model = createModel();

            model.fields(fields => ({
                theme: fields
                    .object()
                    .label("Theme")
                    .fields(fields => ({
                        primaryColor: fields.text().label("Primary Color"),
                        secondaryColor: fields.text().label("Secondary Color")
                    }))
                    .layout([["primaryColor"], ["secondaryColor"]])
            }));

            // Just modify layout
            model.fields(fields => ({
                theme: fields
                    .extend()
                    .object()
                    .layout([["primaryColor", "secondaryColor"]])
            }));

            const result = model.build();
            const themeField = result.contentModel.fields.find(f => f.fieldId === "theme");

            expect(themeField?.settings?.layout).toEqual([["primaryColor", "secondaryColor"]]);
        });
    });

    describe("layout builder integration", () => {
        it("should support array layout replacement", () => {
            const model = createModel();

            model.fields(fields => ({
                theme: fields
                    .object()
                    .label("Theme")
                    .fields(fields => ({
                        primaryColor: fields.text().label("Primary Color"),
                        font: fields.text().label("Font")
                    }))
                    .layout([["primaryColor"], ["font"]])
            }));

            // Replace entire layout
            model.fields(fields => ({
                theme: fields
                    .extend()
                    .object()
                    .fields(fields => ({
                        logoUrl: fields.text().label("Logo URL")
                    }))
                    .layout([["primaryColor", "font"], ["logoUrl"]])
            }));

            const result = model.build();
            const themeField = result.contentModel.fields.find(f => f.fieldId === "theme");

            expect(themeField?.settings?.layout).toEqual([["primaryColor", "font"], ["logoUrl"]]);
        });

        it("should support builder callback for incremental layout changes", () => {
            const model = createModel();

            model.fields(fields => ({
                theme: fields
                    .object()
                    .label("Theme")
                    .fields(fields => ({
                        primaryColor: fields.text().label("Primary Color"),
                        font: fields.text().label("Font")
                    }))
                    .layout([["primaryColor"], ["font"]])
            }));

            // Use builder for incremental changes
            model.fields(fields => ({
                theme: fields
                    .extend()
                    .object()
                    .fields(fields => ({
                        logoUrl: fields.text().label("Logo URL"),
                        customBranding: fields.text().label("Custom Branding")
                    }))
                    .layout(layout =>
                        layout
                            .addField("logoUrl", { after: "font" })
                            .insertRow(["customBranding"], { after: "font" })
                    )
            }));

            const result = model.build();
            const themeField = result.contentModel.fields.find(f => f.fieldId === "theme");

            expect(themeField?.settings?.layout).toEqual([
                ["primaryColor"],
                ["font", "logoUrl"],
                ["customBranding"]
            ]);
        });
    });
});
