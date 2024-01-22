import { createDefaultStorageTransform } from "./default";
import { createObjectStorageTransform } from "./object";
import { createJsonStorageTransform } from "./json";

export const createStorageTransform = () => {
    return [
        createDefaultStorageTransform(),
        createObjectStorageTransform(),
        createJsonStorageTransform()
    ];
};
