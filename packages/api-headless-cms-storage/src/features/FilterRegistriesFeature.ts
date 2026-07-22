import { createFeature } from "@webiny/feature/api/index.js";
import { FieldFilterPathRegistry } from "./fieldFilterPath/abstractions.js";
import { FieldFilterValueTransformRegistry } from "./fieldFilterValueTransform/abstractions.js";
import { FieldFilterCreateRegistry } from "./fieldFilterCreate/abstractions.js";
import { FieldSortingRegistry } from "./fieldSorting/abstractions.js";
import { FieldFilterPathRegistryImpl } from "./fieldFilterPath/FieldFilterPathRegistry.js";
import { FieldFilterValueTransformRegistryImpl } from "./fieldFilterValueTransform/FieldFilterValueTransformRegistry.js";
import { FieldFilterCreateRegistryImpl } from "./fieldFilterCreate/FieldFilterCreateRegistry.js";
import { FieldSortingRegistryImpl } from "./fieldSorting/FieldSortingRegistry.js";
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
