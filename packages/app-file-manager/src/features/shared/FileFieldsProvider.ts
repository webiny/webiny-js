import { FILE_FIELDS } from "./FILE_FIELDS.js";
import { FileFieldsProvider as Abstraction } from "./abstractions.js";

class FileFieldsProviderImpl implements Abstraction.Interface {
    async execute(): Promise<string[]> {
        return FILE_FIELDS;
    }
}

export const FileFieldsProvider = Abstraction.createImplementation({
    implementation: FileFieldsProviderImpl,
    dependencies: []
});
