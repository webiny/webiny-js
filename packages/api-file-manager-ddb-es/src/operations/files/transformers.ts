import { File } from "@webiny/api-file-manager/types";
import { FileIndexTransformPlugin } from "~/plugins/FileIndexTransformPlugin";

interface ToIndexParams {
    plugins: FileIndexTransformPlugin[];
    file: File;
}
export const transformToIndex = async ({ plugins, file }: ToIndexParams): Promise<File> => {
    const originalFile = {
        ...file
    };
    let indexFile = {
        ...file
    };
    for (const plugin of plugins) {
        indexFile = await plugin.toIndex({
            original: originalFile,
            file: indexFile
        });
    }
    return indexFile;
};
interface FromIndexParams {
    plugins: FileIndexTransformPlugin[];
    file: File;
}
export const transformFromIndex = async ({ plugins, file }: FromIndexParams): Promise<File> => {
    let original = {
        ...file
    };
    for (const plugin of plugins) {
        original = await plugin.fromIndex({
            file: original
        });
    }
    return original;
};
