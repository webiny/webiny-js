import { FileManagerContext } from "~/types";
import { ContextPlugin } from "@webiny/api";
import { FileStorage } from "./FileStorage";

const fileStorageContextPlugin = new ContextPlugin<FileManagerContext>(async context => {
    if (!context.fileManager) {
        /**
         * We need to define the fileManager initial property as empty object.
         * When casting as FileManagerContext, typescript is complaining.
         */
        context.fileManager = {} as any;
    }
    context.fileManager.storage = new FileStorage({
        context
    });
});

export default fileStorageContextPlugin;
