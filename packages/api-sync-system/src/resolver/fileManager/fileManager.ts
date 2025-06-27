import { createFileManagerOnPutPlugin } from "./fileManagerOnPut.js";
import { createFileManagerOnDeletePlugin } from "./fileManagerOnDelete.js";

export const createFileManagerPlugins = () => {
    return [createFileManagerOnPutPlugin(), createFileManagerOnDeletePlugin()];
};
