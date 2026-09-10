import {
    FieldType,
    type IFieldTypeFactory
} from "@webiny/app-admin/features/formModel/abstractions.js";
import { FieldBuilder } from "@webiny/app-admin/features/formModel/FieldBuilder.js";

export class AssetFieldBuilder extends FieldBuilder<"asset"> {
    constructor() {
        super("asset");
        this._config.renderer = "cmsAssetPicker";
    }

    override list(): this {
        super.list();
        if (this._config.renderer === "cmsAssetPicker") {
            this._config.renderer = "cmsMultiAssetPicker";
        }
        return this;
    }

    imagesOnly(): this {
        this._config.rendererSettings = { ...this._config.rendererSettings, imagesOnly: true };
        return this;
    }

    accept(mimeTypes: string[]): this {
        this._config.rendererSettings = { ...this._config.rendererSettings, accept: mimeTypes };
        return this;
    }
}

class AssetFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "asset";
    create() {
        return new AssetFieldBuilder();
    }
}

export const AssetFormFieldType = FieldType.createImplementation({
    implementation: AssetFieldTypeFactory,
    dependencies: []
});

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldBuilderRegistry {
        asset(): AssetFieldBuilder;
    }
}
