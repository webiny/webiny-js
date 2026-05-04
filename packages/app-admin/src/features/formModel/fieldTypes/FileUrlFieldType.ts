import { FieldType, type IFieldTypeFactory, type IFieldBuilder } from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";

export class FileUrlFieldBuilder extends FieldBuilder<"fileUrl"> {
    constructor() {
        super("fileUrl");
        this._config.renderer = "fileUrlPicker";
    }
}

class FileUrlFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "fileUrl";
    create(_registry: any) {
        return new FileUrlFieldBuilder();
    }
}

export const FileUrlFieldType = FieldType.createImplementation({
    implementation: FileUrlFieldTypeFactory,
    dependencies: []
});

declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        fileUrl(): IFieldBuilder<"fileUrl", false, string | null>;
    }
}
