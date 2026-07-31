import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { DataFieldBuilder } from "./FieldBuilder.js";
import { RequiredValidator } from "./fieldTypeValidator.js";

export interface IAssetFieldBuilder extends DataFieldBuilder<"asset">, RequiredValidator {
    accept(mimeTypes: string[]): this;
    imagesOnly(): this;
}

class AssetFieldBuilder extends DataFieldBuilder<"asset"> implements IAssetFieldBuilder {
    public constructor() {
        super("asset");
        this.label("Asset");
        this.renderer("assetField");
    }

    required(message?: string): this {
        return this.validation({
            name: "required",
            message: message || "Value is required.",
            settings: {}
        });
    }

    override list(): this {
        super.list();
        this.renderer("assetFields");
        return this;
    }

    accept(mimeTypes: string[]): this {
        this.config.settings = this.config.settings || {};
        this.config.settings.accept = mimeTypes;
        return this;
    }

    imagesOnly(): this {
        this.config.settings = this.config.settings || {};
        this.config.settings.imagesOnly = true;
        return this;
    }
}

class AssetFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "asset";

    create(): IAssetFieldBuilder {
        return new AssetFieldBuilder();
    }
}

export const AssetFieldType = FieldType.createImplementation({
    implementation: AssetFieldTypeFactory,
    dependencies: []
});

declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        asset(): IAssetFieldBuilder;
    }
}
