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
        const pathRegistry = new FieldFilterPathRegistryImpl();
        pathRegistry.register("plainObject", createPlainObjectPathHandler());
        pathRegistry.register("text", createLocationFolderIdPathHandler());
        container.registerInstance(FieldFilterPathRegistry, pathRegistry);

        const transformRegistry = new FieldFilterValueTransformRegistryImpl();
        transformRegistry.register("datetime", createDatetimeTransformHandler());
        container.registerInstance(FieldFilterValueTransformRegistry, transformRegistry);

        const filterCreateRegistry = new FieldFilterCreateRegistryImpl();
        filterCreateRegistry.register("*", createDefaultFilterCreateHandler());
        filterCreateRegistry.register("ref", createRefFilterCreateHandler());
        filterCreateRegistry.register("object", createObjectFilterCreateHandler());
        filterCreateRegistry.register("searchable-json", createSearchableJsonFilterCreateHandler());
        container.registerInstance(FieldFilterCreateRegistry, filterCreateRegistry);

        const sortingRegistry = new FieldSortingRegistryImpl();
        container.registerInstance(FieldSortingRegistry, sortingRegistry);
    }
});
