import { onFolderBeforeDeleteHook } from "~/folder/onFolderBeforeDelete.hook";

import { AcoContext } from "~/types";

export const createAcoHooks = (context: AcoContext) => {
    onFolderBeforeDeleteHook(context);
};
