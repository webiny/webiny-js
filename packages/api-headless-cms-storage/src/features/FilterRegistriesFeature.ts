import { createFeature } from "@webiny/feature/api/index.js";
import { FieldFilterPathRegistry } from "../abstractions/FieldFilterPathRegistry.js";
import { FieldFilterValueTransformRegistry } from "../abstractions/FieldFilterValueTransformRegistry.js";
import { FieldFilterCreateRegistry } from "../abstractions/FieldFilterCreateRegistry.js";
import { FieldSortingRegistry } from "../abstractions/FieldSortingRegistry.js";
import { FieldFilterPathRegistryImpl } from "../implementations/FieldFilterPathRegistryImpl.js";
import { FieldFilterValueTransformRegistryImpl } from "../implementations/FieldFilterValueTransformRegistryImpl.js";
import { FieldFilterCreateRegistryImpl } from "../implementations/FieldFilterCreateRegistryImpl.js";
import { FieldSortingRegistryImpl } from "../implementations/FieldSortingRegistryImpl.js";
import { createPlainObjectPathHandler } from "../handlers/plainObjectPathHandler.js";
import { createLocationFolderIdPathHandler } from "../handlers/locationFolderIdPathHandler.js";
import { createDatetimeTransformHandler } from "../handlers/datetimeTransformHandler.js";
import { createDefaultFilterCreateHandler } from "../handlers/defaultFilterCreateHandler.js";
import { createRefFilterCreateHandler } from "../handlers/refFilterCreateHandler.js";
import { createObjectFilterCreateHandler } from "../handlers/objectFilterCreateHandler.js";
import { createSearchableJsonFilterCreateHandler } from "../handlers/searchableJsonFilterCreateHandler.js";

export const FilterRegistriesFeature = createFeature({
    name: "cms.storage.filterRegistries",
    register: container => {
        container.registerFactory(FieldFilterPathRegistry, () => {
            const registry = new FieldFilterPathRegistryImpl();
            registry.register("plainObject", createPlainObjectPathHandler());
            registry.register("text", createLocationFolderIdPathHandler());
            return registry;
        });

        container.registerFactory(FieldFilterValueTransformRegistry, () => {
            const registry = new FieldFilterValueTransformRegistryImpl();
            registry.register("datetime", createDatetimeTransformHandler());
            return registry;
        });

        container.registerFactory(FieldFilterCreateRegistry, () => {
            const registry = new FieldFilterCreateRegistryImpl();
            registry.register("*", createDefaultFilterCreateHandler());
            registry.register("ref", createRefFilterCreateHandler());
            registry.register("object", createObjectFilterCreateHandler());
            registry.register("searchable-json", createSearchableJsonFilterCreateHandler());
            return registry;
        });

        container.registerFactory(FieldSortingRegistry, () => {
            return new FieldSortingRegistryImpl();
        });
    }
});
