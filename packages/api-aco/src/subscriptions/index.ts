import { ContextPlugin } from "@webiny/api";
import { afterFolderDelete } from "./afterFolderDelete";
import { ACOContext } from "~/types";

export const subscriptions = (): ContextPlugin<ACOContext>[] => {
    return [afterFolderDelete()];
};
