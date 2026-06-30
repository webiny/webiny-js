import type { PermissionRendererConfig } from "~/permissions/types.js";

/**
 * Collapses renderers that share the same group `name` into a single renderer,
 * concatenating their schema entities (deduped by entity id). This lets multiple
 * apps contribute their own entities to one shared permission group (e.g. several
 * dev tools each registering into "dev-tools") while the UI still shows one group.
 *
 * Group metadata (title, description, icon, system) is taken from the first
 * registration of a given name; subsequent registrations only add entities.
 */
export const mergeByName = (renderers: PermissionRendererConfig[]): PermissionRendererConfig[] => {
    const byName = new Map<string, PermissionRendererConfig>();

    for (const renderer of renderers) {
        const existing = byName.get(renderer.name);

        if (!existing) {
            // Clone the schema (and its entities) so we never mutate the registered config.
            byName.set(
                renderer.name,
                renderer.schema
                    ? {
                          ...renderer,
                          schema: {
                              ...renderer.schema,
                              entities: [...(renderer.schema.entities ?? [])]
                          }
                      }
                    : { ...renderer }
            );
            continue;
        }

        // Merge additional entities into the already-seen group.
        if (existing.schema && renderer.schema) {
            const entities = existing.schema.entities ?? [];
            const seen = new Set(entities.map(entity => entity.id));
            for (const entity of renderer.schema.entities ?? []) {
                if (!seen.has(entity.id)) {
                    entities.push(entity);
                    seen.add(entity.id);
                }
            }
            existing.schema.entities = entities;
        }
    }

    return Array.from(byName.values());
};
