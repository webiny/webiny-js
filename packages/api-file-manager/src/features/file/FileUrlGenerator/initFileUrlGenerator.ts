import type { FileUrlGenerator } from "./abstractions.js";

const initializations = new WeakMap<FileUrlGenerator.Interface, Promise<void>>();

/**
 * Runs the generator's `init()` once per instance, however many URLs are generated. The default
 * generator reads the File Manager settings there, so this is called when a URL is first needed
 * instead of on every request while the GraphQL schema is composed.
 */
export const initFileUrlGenerator = (generator: FileUrlGenerator.Interface): Promise<void> => {
    if (!generator.init) {
        return Promise.resolve();
    }

    let initialization = initializations.get(generator);
    if (!initialization) {
        initialization = generator.init();
        initializations.set(generator, initialization);
    }

    return initialization;
};
