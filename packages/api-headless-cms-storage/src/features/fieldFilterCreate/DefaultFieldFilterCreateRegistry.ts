import { FieldFilterCreateRegistry } from "./abstractions.js";
import { FieldFilterCreateRegistryImpl } from "./FieldFilterCreateRegistry.js";
import { createDefaultFilterCreateHandler } from "~/handlers/defaultFilterCreateHandler.js";
import { createRefFilterCreateHandler } from "~/handlers/refFilterCreateHandler.js";
import { createObjectFilterCreateHandler } from "~/handlers/objectFilterCreateHandler.js";
import { createSearchableJsonFilterCreateHandler } from "~/handlers/searchableJsonFilterCreateHandler.js";

class DefaultFieldFilterCreateRegistryImpl
    extends FieldFilterCreateRegistryImpl
    implements FieldFilterCreateRegistry.Interface
{
    public constructor() {
        super();
        const defaultHandler = createDefaultFilterCreateHandler();
        const refHandler = createRefFilterCreateHandler();
        const objectHandler = createObjectFilterCreateHandler();
        const searchableJsonHandler = createSearchableJsonFilterCreateHandler();

        this.register("*", defaultHandler);
        this.register("ref", refHandler);
        this.register("object", objectHandler);
        this.register("searchable-json", searchableJsonHandler);
    }
}

export const DefaultFieldFilterCreateRegistry = FieldFilterCreateRegistry.createImplementation({
    implementation: DefaultFieldFilterCreateRegistryImpl,
    dependencies: []
});
