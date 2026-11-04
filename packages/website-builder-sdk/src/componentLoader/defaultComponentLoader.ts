import type { ComponentLoaderFactory } from "./ComponentLoader.js";

let defaultComponentLoader: ComponentLoaderFactory | undefined;

/**
 * Set the component loader that content clients use when their config has none. A framework
 * integration sets it on import, the way it sets the headers provider.
 */
export const setDefaultComponentLoader = (factory: ComponentLoaderFactory | undefined) => {
    defaultComponentLoader = factory;
};

export const getDefaultComponentLoader = () => defaultComponentLoader;
