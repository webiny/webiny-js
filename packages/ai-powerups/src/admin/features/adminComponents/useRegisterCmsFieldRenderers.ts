import { useEffect, useRef } from "react";
import { useContainer } from "@webiny/app";
import { createCmsFieldRenderer } from "./createCmsFieldRenderer.js";
import type { AdminComponent } from "./abstractions.js";

/**
 * Registers each stored renderer into the container, so the field editor offers it.
 *
 * Imperative rather than a `<RegisterFeature>` because the list is not known until the query
 * returns, and a feature's `register` runs with whatever it was given at mount.
 *
 * Guarded by id: `resolveAll` returns everything registered, so registering the same component twice
 * puts it in the Appearance list twice. Re-running this effect after a refetch is therefore normal
 * and must be idempotent.
 *
 * Known gap, and the reason this is worth reviewing. `CmsFormModelBuilder` is a singleton that reads
 * the renderer list once, when the first CMS entry form resolves it, and turns it into a
 * name -> component map. Registering after that point leaves the new renderer out of the map, and a
 * field pointing at it falls back to its default renderer silently: `applyFieldProps` skips
 * `builder.renderer()` entirely on a miss rather than erroring. In practice the boot fetch wins,
 * because reaching an entry form takes a navigation. A hard reload straight onto an entry URL is the
 * case that can lose the race.
 */
export const useRegisterCmsFieldRenderers = (components: AdminComponent[]) => {
    const container = useContainer();
    const registered = useRef(new Set<string>());

    useEffect(() => {
        for (const component of components) {
            if (registered.current.has(component.id)) {
                continue;
            }

            registered.current.add(component.id);
            container.register(createCmsFieldRenderer(component));
        }
    }, [components, container]);
};
