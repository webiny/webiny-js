import { FieldType, type IFieldTypeFactory } from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";

export interface FileFieldSettings extends Record<string, unknown> {
    images?: boolean;
    accept?: string[];
    own?: boolean;
    scope?: string;
}

export class FileFieldBuilder extends FieldBuilder<"file"> {
    constructor() {
        super("file");
        this._config.renderer = "filePicker";
    }

    override list(): this {
        super.list();
        if (this._config.renderer === "filePicker") {
            this._config.renderer = "multiFilePicker";
        }
        return this;
    }

    imagesOnly(): this {
        this._config.rendererSettings = { ...this._config.rendererSettings, images: true };
        return this;
    }

    accept(mimeTypes: string[]): this {
        this._config.rendererSettings = { ...this._config.rendererSettings, accept: mimeTypes };
        return this;
    }

    own(): this {
        this._config.rendererSettings = { ...this._config.rendererSettings, own: true };
        return this;
    }

    scope(scope: string): this {
        this._config.rendererSettings = { ...this._config.rendererSettings, scope };
        return this;
    }
}

class FileFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "file";
    create(_registry: any) {
        return new FileFieldBuilder();
    }
}

export const FileFieldType = FieldType.createImplementation({
    implementation: FileFieldTypeFactory,
    dependencies: []
});

declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        file(): FileFieldBuilder;
    }
}
