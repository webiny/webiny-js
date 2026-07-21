import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { ModelBuilderFeature } from "~/features/modelBuilder/feature.js";
import { ModelFactory, ModelsProvider } from "~/features/modelBuilder/index.js";
import type { CmsModelObjectField } from "~/types/index.js";

const findChild = (field: CmsModelObjectField, fieldId: string) => {
    return (field.settings.fields ?? []).find(f => f.fieldId === fieldId);
};

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

    it("builds as an object field tagged as an asset with the asset renderer", async () => {
        const model = await buildModelWith(fields => ({
            hero: fields.asset().label("Hero")
        }));

        const hero = model.fields.find(f => f.fieldId === "hero") as CmsModelObjectField;
        expect(hero).toBeDefined();
        // Reuses the object machinery — typed GraphQL, storage, indexing come for free.
        expect(hero.type).toBe("object");
        expect(hero.tags).toContain("wby:asset");
        expect(hero.renderer).toEqual({ name: "asset-input", settings: null });
    });

    it("exposes the full discriminated shape as nested typed sub-fields", async () => {
        const model = await buildModelWith(fields => ({
            hero: fields.asset()
        }));

        const hero = model.fields.find(f => f.fieldId === "hero") as CmsModelObjectField;

        const topLevel = (hero.settings.fields ?? []).map(f => f.fieldId).sort();
        expect(topLevel).toEqual([
            "document",
            "id",
            "image",
            "name",
            "size",
            "src",
            "type",
            "video"
        ]);

        // image sub-object carries crop + focalPoint + metadata.
        const image = findChild(hero, "image") as CmsModelObjectField;
        expect(image.type).toBe("object");
        const imageFields = (image.settings.fields ?? []).map(f => f.fieldId).sort();
        expect(imageFields).toEqual(["alt", "caption", "crop", "focalPoint", "height", "width"]);

        const crop = findChild(image, "crop") as CmsModelObjectField;
        expect((crop.settings.fields ?? []).map(f => f.fieldId).sort()).toEqual([
            "bottom",
            "left",
            "right",
            "top"
        ]);

        const focalPoint = findChild(image, "focalPoint") as CmsModelObjectField;
        expect((focalPoint.settings.fields ?? []).map(f => f.fieldId).sort()).toEqual(["x", "y"]);

        // video carries autoplay.
        const video = findChild(hero, "video") as CmsModelObjectField;
        expect((video.settings.fields ?? []).map(f => f.fieldId)).toContain("autoplay");
    });

    it("supports imagesOnly() and accept() configuration", async () => {
        const model = await buildModelWith(fields => ({
            cover: fields.asset().imagesOnly().accept(["image/png", "image/jpeg"])
        }));

        const cover = model.fields.find(f => f.fieldId === "cover") as CmsModelObjectField;
        expect(cover.settings.imagesOnly).toBe(true);
        expect(cover.settings.accept).toEqual(["image/png", "image/jpeg"]);
    });

    it("supports list() for multiple assets", async () => {
        const model = await buildModelWith(fields => ({
            gallery: fields.asset().list()
        }));

        const gallery = model.fields.find(f => f.fieldId === "gallery") as CmsModelObjectField;
        expect(gallery.list).toBe(true);
        // List mode switches to the dedicated multi-asset renderer (mirrors file / files).
        expect(gallery.renderer).toEqual({ name: "asset-inputs", settings: null });
    });
});
