import { createFeature } from "@webiny/feature/api/index.js";
import { DbRegistry } from "./DbRegistry.js";

/**
 * Track containers DbRegistry has already been registered on. The container's `register()` APPENDS
 * registrations and `resolve()` uses the LAST one, caching singletons per-registration — so calling
 * this feature twice on the same container creates a second DbRegistry singleton and orphans the
 * first. That breaks consumers that register into DbRegistry at different times (e.g. the CMS
 * storage `beforeInit` registers entities into registration #1, while a later resolve — like the
 * api-elasticsearch-tasks sync — gets the empty registration #2). Registering once per container
 * keeps a single shared instance.
 */
const registeredContainers = new WeakSet<object>();

export const DbRegistryFeature = createFeature({
    name: "DbRegistry",
    register: container => {
        if (registeredContainers.has(container)) {
            return;
        }
        registeredContainers.add(container);
        container.register(DbRegistry).inSingletonScope();
    }
});
