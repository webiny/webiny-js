import { ContextPlugin } from "@webiny/api";
import { onFolderBeforeDeleteHook } from "~/hooks/folder/onFolderBeforeDelete.hook";
import { AcoContext } from "~/types";

export const createAcoHooks = (): ContextPlugin<AcoContext>[] => {
    return [onFolderBeforeDeleteHook()];
};
