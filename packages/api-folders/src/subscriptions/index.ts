import { ContextPlugin } from "@webiny/api";
import { afterFolderDelete } from "./afterFolderDelete";
import { FoldersContext } from "~/types";

export const subscriptions = (): ContextPlugin<FoldersContext>[] => {
    return [afterFolderDelete()];
};
