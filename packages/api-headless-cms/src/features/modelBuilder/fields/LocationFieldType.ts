import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilderRegistry } from "../abstractions.js";
import { IObjectFieldBuilder, ObjectFieldBuilder } from "./ObjectFieldType.js";

class LocationFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "location";

    create(registry: FieldBuilderRegistry.Interface): IObjectFieldBuilder {
        const builder = new ObjectFieldBuilder(registry);
        return builder.label("Location").fields(fields => ({
            folderId: fields.text().label("Folder ID").settings({ path: "location.folderId" })
        }));
    }
}

export const LocationFieldType = FieldType.createImplementation({
    implementation: LocationFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        location(): IObjectFieldBuilder;
    }
}
