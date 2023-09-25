import { createDefaultStorageTransform } from "~/storage/default";
import { createObjectStorageTransform } from "~/storage/object";
import { createTextStorageTransformPlugin } from "~/storage/text";
import { createFileStorageTransformPlugin } from "~/storage/file";

export const createStorageTransformPlugins = () => {
    return [
        createDefaultStorageTransform(),
        createFileStorageTransformPlugin(),
        createTextStorageTransformPlugin(),
        createObjectStorageTransform()
    ];
};
