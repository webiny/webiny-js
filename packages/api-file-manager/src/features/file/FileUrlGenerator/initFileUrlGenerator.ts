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
        // A failed init() is forgotten, so the next URL in the same request (a batched request runs
        // several operations against one generator) tries again instead of reusing the failure.
        initialization = generator.init().catch(error => {
            initializations.delete(generator);
            throw error;
        });
        initializations.set(generator, initialization);
    }

    return initialization;
};
