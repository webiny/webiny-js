import { createFeature } from "@webiny/feature/api/index.js";
import { DefaultFieldFilterPathRegistry } from "./fieldFilterPath/DefaultFieldFilterPathRegistry.js";
import { DefaultFieldFilterValueTransformRegistry } from "./fieldFilterValueTransform/DefaultFieldFilterValueTransformRegistry.js";
import { DefaultFieldFilterCreateRegistry } from "./fieldFilterCreate/DefaultFieldFilterCreateRegistry.js";
import { DefaultFieldSortingRegistry } from "./fieldSorting/DefaultFieldSortingRegistry.js";

/**
 * The registries are mutable: extensions add their own handlers with `register()`. They are container
 * scoped, so registering the feature once in the root still gives every request (child) container its
 * own registries. A shared instance would collect every request's registrations.
 */
export const FilterRegistriesFeature = createFeature({
    name: "cms.storage.filterRegistries",
    register: container => {
        container.register(DefaultFieldFilterPathRegistry).inContainerScope();
        container.register(DefaultFieldFilterValueTransformRegistry).inContainerScope();
        container.register(DefaultFieldFilterCreateRegistry).inContainerScope();
        container.register(DefaultFieldSortingRegistry).inContainerScope();
    }
});
