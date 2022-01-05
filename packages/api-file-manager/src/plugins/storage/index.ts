import { FileManagerContext } from "~/types";
import { ContextPlugin } from "@webiny/handler";
import { FileStorage } from "./FileStorage";

const fileStorageContextPlugin = new ContextPlugin<FileManagerContext>(async context => {
    if (!context.fileManager) {
        context.fileManager = {} as any;
    }
    context.fileManager.storage = new FileStorage({
        context
    });
});

export default fileStorageContextPlugin;
