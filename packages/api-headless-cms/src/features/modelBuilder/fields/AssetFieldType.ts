import type { CmsModelField } from "~/types/index.js";
import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilderRegistry } from "../abstractions.js";
import { IObjectFieldBuilder, ObjectFieldBuilder } from "./ObjectFieldType.js";

/**
 * The **Asset** field — a first-class, typed replacement for the legacy `file`
 * field. Unlike `file` (which stores a bare URL string), an asset stores a rich,
 * file-type-discriminated object that mirrors the Website Builder asset value:
 *
 *   { id, src, name, type, size, image?, document?, video? }
 *
 * It is implemented as a regular `object` field with a fixed nested schema, so it
 * reuses the entire object-field machinery — typed GraphQL types (via
 * `ObjectToGraphQL`), storage, indexing, validation, and AST conversion — with no
 * new field-type plumbing. A dedicated `assetField` Admin renderer (registered on
 * the app side) turns the generic object form into an asset picker + image editor;
 * the `wby:asset` tag lets tooling recognize an asset field despite its underlying
 * `object` type (needed to deprecate `file` and default new models to `asset`).
 *
 * The shape is intentionally identical to `WebinyAsset` in
 * `@webiny/website-builder-sdk`, so a value round-trips between the CMS and the
 * Website Builder without conversion.
 */

/** Tag stamped on every asset field so it can be distinguished from a plain object. */
export const ASSET_FIELD_TAG = "wby:asset";

/** Admin renderer name for the asset field (resolves to the stored name below). */
export const ASSET_FIELD_RENDERER = "assetField";

/** Stored renderer names for single- and multi-asset fields. */
export const ASSET_RENDERER_NAME = "asset-input";
export const ASSET_LIST_RENDERER_NAME = "asset-inputs";

/**
 * True when a field is an Asset field. Asset fields are stored as `object` fields
 * (so they reuse the object GraphQL/storage machinery); the asset renderer name is
 * the reliable discriminator — it is always present, whether the field was created
 * in code (`fields.asset()`) or in the Admin model editor.
 */
export const isAssetField = (field: {
    type?: string | null;
    renderer?: { name?: string | null } | null;
}): boolean => {
    if (field.type !== "object") {
        return false;
    }
    const rendererName = field.renderer?.name;
    return rendererName === ASSET_RENDERER_NAME || rendererName === ASSET_LIST_RENDERER_NAME;
};

export interface IAssetFieldBuilder extends IObjectFieldBuilder {
    /** Restrict the picker to the given MIME types (e.g. `["image/*"]`). */
    accept(mimeTypes: string[]): this;
    /** Convenience for `accept(["image/*"])`. */
    imagesOnly(): this;
}

class AssetFieldBuilder extends ObjectFieldBuilder implements IAssetFieldBuilder {
    public constructor(registry: FieldBuilderRegistry.Interface) {
        super(registry);

        this.label("Asset");
        this.renderer(ASSET_FIELD_RENDERER);
        this.tags([ASSET_FIELD_TAG]);
        this.fields(fields => ({
            id: fields.text().label("ID"),
            src: fields.text().label("Source URL"),
            name: fields.text().label("File name"),
            type: fields.text().label("MIME type"),
            size: fields.number().label("Size"),
            image: fields
                .object()
                .label("Image")
                .fields(image => ({
                    width: image.number().label("Width"),
                    height: image.number().label("Height"),
                    crop: image
                        .object()
                        .label("Crop")
                        .fields(crop => ({
                            top: crop.number().label("Top"),
                            left: crop.number().label("Left"),
                            bottom: crop.number().label("Bottom"),
                            right: crop.number().label("Right")
                        })),
                    focalPoint: image
                        .object()
                        .label("Focal point")
                        .fields(focalPoint => ({
                            x: focalPoint.number().label("X"),
                            y: focalPoint.number().label("Y")
                        })),
                    alt: image.text().label("Alt text"),
                    caption: image.text().label("Caption")
                })),
            document: fields
                .object()
                .label("Document")
                .fields(document => ({
                    pages: document.number().label("Pages")
                })),
            video: fields
                .object()
                .label("Video")
                .fields(video => ({
                    autoplay: video.boolean().label("Autoplay"),
                    poster: video.text().label("Poster URL")
                }))
        }));
    }

    override list(): this {
        super.list();
        // Multi-asset fields use a dedicated renderer (mirrors file / files).
        this.renderer("assetFields");
        return this;
    }

    accept(mimeTypes: string[]): this {
        return this.settings({ accept: mimeTypes });
    }

    imagesOnly(): this {
        return this.settings({ imagesOnly: true });
    }
}

/**
 * Build the canonical Asset field `settings` (`fields` + `layout`) using the same
 * builder that backs `fields.asset()`. The model normalizer stamps this onto every
 * asset field on save, so admin-created and default-fields asset fields end up with
 * a nested schema identical to code-created ones — a single source of truth.
 */
export const buildCanonicalAssetFieldSettings = (
    registry: FieldBuilderRegistry.Interface
): CmsModelField["settings"] => {
    const result = new AssetFieldBuilder(registry).build();
    return (result as { field: CmsModelField }).field.settings;
};

class AssetFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "asset";

    create(registry: FieldBuilderRegistry.Interface): IAssetFieldBuilder {
        return new AssetFieldBuilder(registry);
    }
}

export const AssetFieldType = FieldType.createImplementation({
    implementation: AssetFieldTypeFactory,
    dependencies: []
});

// Module augmentation: `fields.asset()` autocomplete. (The `assetField` renderer
// is declared directly in `DataFieldBuilder.ts` alongside the other built-ins.)
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        asset(): IAssetFieldBuilder;
    }
}
