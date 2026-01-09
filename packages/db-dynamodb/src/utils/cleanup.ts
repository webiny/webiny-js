import type { Entity } from "~/toolbox.js";

/**
 * The attributes defined by us or the dynamodb-toolbox library.
 * Add more attributes if necessary.
 */
const attributesToRemove = [
    "PK",
    "SK",
    "created",
    "_ct",
    "modified",
    "_mt",
    "entity",
    "_et",
    "GSI1_PK",
    "GSI1_SK",
    "GSI2_PK",
    "GSI2_SK",
    "GSI3_PK",
    "GSI3_SK",
    "GSI4_PK",
    "GSI4_SK",
    "GSI5_PK",
    "GSI5_SK",
    "GSI_TENANT",
    "TYPE"
];

export function cleanupItem<T>(
    entity: Entity<any>,
    item?: T | null,
    removeAttributes: string[] = []
): T | null {
    if (!item) {
        return null;
    }
    const newItem = {
        ...item
    };
    const targets = attributesToRemove.concat(removeAttributes);
    const attributes = entity.schema.attributes;
    for (const key in item) {
        if (item.hasOwnProperty(key) === false) {
            continue;
        }
        if (attributes[key] && targets.includes(key) === false) {
            continue;
        }
        delete newItem[key];
    }
    return newItem;
}

export function cleanupItems<T>(
    entity: Entity<any>,
    items: T[],
    removeAttributes: string[] = []
): T[] {
    return items.map(item => cleanupItem<T>(entity, item, removeAttributes) as T);
}
