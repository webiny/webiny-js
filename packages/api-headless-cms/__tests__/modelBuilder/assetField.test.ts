import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { ModelBuilderFeature } from "~/features/modelBuilder/feature.js";
import { ModelFactory, ModelsProvider } from "~/features/modelBuilder/index.js";
import type { CmsModelField } from "~/types/index.js";

describe("Asset Field Type", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    const buildModelWith = async (
        configure: (fields: ModelFactory.FieldBuilder) => Record<string, any>
    ) => {
        class AssetModel implements ModelFactory.Interface {
            async execute(builder: ModelFactory.Builder) {
                return [
                    builder
                        .private({ modelId: "assetModel", name: "Asset Model" })
                        .fields(configure)
                ];
            }
        }
        container.registerInstance(ModelFactory, new AssetModel());
        const models = await container.resolve(ModelsProvider).list("root");
        return models.find(m => m.modelId === "assetModel")!;
    };

    it("builds as a first-class asset field type", async () => {
        const model = await buildModelWith(fields => ({
            hero: fields.asset().label("Hero")
        }));

        const hero = model.fields.find(f => f.fieldId === "hero") as CmsModelField;
        expect(hero).toBeDefined();
        expect(hero.type).toBe("asset");
        expect(hero.renderer).toEqual({ name: "asset-input", settings: null });
    });

    it("has no nested sub-fields (shape is owned by the GraphQL layer)", async () => {
        const model = await buildModelWith(fields => ({
            hero: fields.asset()
        }));

        const hero = model.fields.find(f => f.fieldId === "hero") as CmsModelField;
        expect(hero.settings?.fields).toBeUndefined();
    });

    it("supports imagesOnly() and accept() configuration", async () => {
        const model = await buildModelWith(fields => ({
            cover: fields.asset().imagesOnly().accept(["image/png", "image/jpeg"])
        }));

        const cover = model.fields.find(f => f.fieldId === "cover") as CmsModelField;
        expect(cover.settings?.imagesOnly).toBe(true);
        expect(cover.settings?.accept).toEqual(["image/png", "image/jpeg"]);
    });

    it("supports list() for multiple assets", async () => {
        const model = await buildModelWith(fields => ({
            gallery: fields.asset().list()
        }));

        const gallery = model.fields.find(f => f.fieldId === "gallery") as CmsModelField;
        expect(gallery.list).toBe(true);
        expect(gallery.renderer).toEqual({ name: "asset-inputs", settings: null });
    });
});
