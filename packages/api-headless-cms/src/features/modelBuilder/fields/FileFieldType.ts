import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import { RequiredValidator } from "./validators.js";

export interface IFileFieldBuilder extends FieldBuilder<"file">, RequiredValidator {
    imagesOnly(): this;
}

class FileFieldBuilder extends FieldBuilder<"file"> implements IFileFieldBuilder {
    public constructor() {
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

    create(): IFileFieldBuilder {
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

declare module "./FieldBuilder.js" {
    interface FieldRendererRegistry {
        "file-input": { fieldType: "file"; settings: undefined };
        "file-inputs": { fieldType: "file"; settings: undefined };
    }
}
