import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { ModelBuilderFeature } from "~/features/modelBuilder/feature.js";
import { FieldBuilderRegistry } from "~/features/modelBuilder/abstractions.js";
import { normalizeAssetFields } from "~/features/modelBuilder/fields/normalizeAssetFields.js";
import { assignModelDefaultFields } from "~/crud/contentModel/defaultFields.js";

const ASSET_SUB_FIELDS = ["document", "id", "image", "name", "size", "src", "type", "video"];

describe("normalizeAssetFields", () => {
    let container: Container;
    let registry: FieldBuilderRegistry.Interface;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
        registry = container.resolve(FieldBuilderRegistry);
    });

    it("stamps the canonical nested schema onto a minimal asset field", () => {
        const fields: any[] = [
            {
                id: "x",
                fieldId: "image",
                type: "object",
                label: "Image",
                renderer: { name: "asset-input" },
                settings: { imagesOnly: true }
            }
        ];
        normalizeAssetFields(fields, registry);

        const image = fields[0];
        // Existing settings are preserved.
        expect(image.settings.imagesOnly).toBe(true);
        // Canonical nested schema is stamped in.
        expect((image.settings.fields ?? []).map((f: any) => f.fieldId).sort()).toEqual(
            ASSET_SUB_FIELDS
        );
        expect(Array.isArray(image.settings.layout)).toBe(true);
    });

    it("recurses into non-asset object fields to reach nested asset fields", () => {
        const fields: any[] = [
            {
                id: "g",
                fieldId: "group",
                type: "object",
                label: "Group",
                renderer: { name: "object-accordion" },
                settings: {
                    fields: [
                        {
                            id: "c",
                            fieldId: "cover",
                            type: "object",
                            label: "Cover",
                            renderer: { name: "asset-input" },
                            settings: {}
                        }
                    ]
                }
            }
        ];
        normalizeAssetFields(fields, registry);

        const cover = fields[0].settings.fields[0];
        expect((cover.settings.fields ?? []).map((f: any) => f.fieldId).sort()).toEqual(
            ASSET_SUB_FIELDS
        );
    });

    it("leaves models without asset fields untouched", () => {
        const fields: any[] = [
            {
                id: "t",
                fieldId: "title",
                type: "text",
                label: "Title",
                renderer: { name: "text-input" },
                settings: {}
            }
        ];
        normalizeAssetFields(fields, registry);
        expect(fields[0].settings.fields).toBeUndefined();
    });

    it("upgrades the default-fields image field into a full asset field", () => {
        const model: any = {};
        assignModelDefaultFields(model);

        const image = model.fields.find((f: any) => f.fieldId === "image");
        expect(image.type).toBe("object");
        expect(image.renderer).toEqual({ name: "asset-input" });

        normalizeAssetFields(model.fields, registry);
        expect((image.settings.fields ?? []).map((f: any) => f.fieldId).sort()).toEqual(
            ASSET_SUB_FIELDS
        );
    });
});
