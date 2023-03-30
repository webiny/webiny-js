import { onFolderBeforeDeleteHook } from "~/folder/onFolderBeforeDelete.hook";

import { ACOContext } from "~/types";

export const createAcoHooks = (context: ACOContext) => {
    onFolderBeforeDeleteHook(context);
};
