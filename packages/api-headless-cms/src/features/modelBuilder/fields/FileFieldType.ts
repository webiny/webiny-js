import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import type { IFieldBuilderRegistry } from "../abstractions.js";

export interface IFileFieldBuilder extends FieldBuilder<"file"> {
    required(message?: string): this;
    imagesOnly(): this;
}

class FileFieldBuilder extends FieldBuilder<"file"> implements IFileFieldBuilder {
    constructor() {
        super("file");
    }

    required(message?: string): this {
        return this.validation({
            name: "required",
            message: message || "Value is required.",
            settings: {}
        });
    }

    imagesOnly(): this {
        this.config.settings = this.config.settings || {};
        this.config.settings.imagesOnly = true;
        return this;
    }
}

class FileFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "file";

    create(_registry: IFieldBuilderRegistry): IFileFieldBuilder {
        return new FileFieldBuilder();
    }
}

export const FileFieldType = FieldType.createImplementation({
    implementation: FileFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        file(): IFileFieldBuilder;
    }
}
