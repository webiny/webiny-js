import type { ComponentLoader, ComponentLoaderFactory } from "./ComponentLoader.js";
import type { ComponentLoaderFactoryParams } from "./ComponentLoader.js";
import { getDefaultComponentLoader } from "./defaultComponentLoader.js";
import { RegistryOnlyComponentLoader } from "./RegistryOnlyComponentLoader.js";

/**
 * Create a content client's loader: its own factory if it has one, else the default set with
 * `setDefaultComponentLoader`, else a loader that loads nothing.
 */
export function createComponentLoader(
    factory: ComponentLoaderFactory | undefined,
    params: ComponentLoaderFactoryParams
): ComponentLoader {
    const resolved = factory ?? getDefaultComponentLoader();
    if (!resolved) {
        return new RegistryOnlyComponentLoader();
    }
    return resolved(params);
}
