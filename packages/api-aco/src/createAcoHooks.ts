import { ContextPlugin } from "@webiny/api";

import { onFolderBeforeDeleteHook } from "~/folder/onFolderBeforeDelete.hook";

import { AcoContext } from "~/types";

export const createAcoHooks = () =>
    new ContextPlugin<AcoContext>(async context => {
        onFolderBeforeDeleteHook(context);
    });
