import { FieldFilterPathRegistry } from "./abstractions.js";
import { FieldFilterPathRegistryImpl } from "./FieldFilterPathRegistry.js";
import { createPlainObjectPathHandler } from "~/handlers/plainObjectPathHandler.js";
import { createLocationFolderIdPathHandler } from "~/handlers/locationFolderIdPathHandler.js";

class DefaultFieldFilterPathRegistryImpl
    extends FieldFilterPathRegistryImpl
    implements FieldFilterPathRegistry.Interface
{
    public constructor() {
        super();
        const plainObjectHandler = createPlainObjectPathHandler();
        const locationFolderIdHandler = createLocationFolderIdPathHandler();

        this.register("plainObject", plainObjectHandler);
        this.register("text", locationFolderIdHandler);
    }
}

export const DefaultFieldFilterPathRegistry = FieldFilterPathRegistry.createImplementation({
    implementation: DefaultFieldFilterPathRegistryImpl,
    dependencies: []
});
