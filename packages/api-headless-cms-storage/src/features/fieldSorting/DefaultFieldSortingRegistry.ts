import { FieldSortingRegistry } from "./abstractions.js";
import { FieldSortingRegistryImpl } from "./FieldSortingRegistry.js";

class DefaultFieldSortingRegistryImpl
    extends FieldSortingRegistryImpl
    implements FieldSortingRegistry.Interface {}

export const DefaultFieldSortingRegistry = FieldSortingRegistry.createImplementation({
    implementation: DefaultFieldSortingRegistryImpl,
    dependencies: []
});
