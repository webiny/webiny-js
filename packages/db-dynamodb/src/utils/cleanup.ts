import type { EntitySchema } from "~/utils/EntitySchema.js";

export function cleanupItem<T>(schema: EntitySchema, item?: T | null): T | null {
    if (!item) {
        return null;
    }
    return schema.unmarshal<T>(item as any);
}

export function cleanupItems<T>(schema: EntitySchema, items: T[]): T[] {
    return items.map(item => cleanupItem<T>(schema, item) as T);
}
