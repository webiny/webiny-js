import { FieldFilterValueTransformRegistry } from "./abstractions.js";
import { FieldFilterValueTransformRegistryImpl } from "./FieldFilterValueTransformRegistry.js";
import { createDatetimeTransformHandler } from "~/handlers/datetimeTransformHandler.js";

class DefaultFieldFilterValueTransformRegistryImpl
    extends FieldFilterValueTransformRegistryImpl
    implements FieldFilterValueTransformRegistry.Interface
{
    public constructor() {
        super();
        const datetimeHandler = createDatetimeTransformHandler();

        this.register("datetime", datetimeHandler);
    }
}

export const DefaultFieldFilterValueTransformRegistry =
    FieldFilterValueTransformRegistry.createImplementation({
        implementation: DefaultFieldFilterValueTransformRegistryImpl,
        dependencies: []
    });
