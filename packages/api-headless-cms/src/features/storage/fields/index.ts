/**
 * Storage transforms are used to transform the data before it is saved to the database and after it is read from the database.
 */
import { createDefaultStorageTransform } from "./default.js";
import { createObjectStorageTransform } from "./object.js";
import { createJsonStorageTransform } from "./json.js";
import { createDynamicZoneStorageTransform } from "./dynamicZone.js";
import { createDateStorageTransformPlugin } from "./date.js";

export const createStorageTransform = () => {
    return [
        createDefaultStorageTransform(),
        createDateStorageTransformPlugin(),
        createObjectStorageTransform(),
        createJsonStorageTransform(),
        createDynamicZoneStorageTransform()
    ];
};
