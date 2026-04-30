import { FieldType, type IFieldTypeFactory } from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";

export class FileFieldBuilder extends FieldBuilder<"file"> {
    constructor() {
        super("file");
        this._config.renderer = "filePicker";
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
        file(): IFieldBuilder<"file", false, FileValue | null>;
    }
}
