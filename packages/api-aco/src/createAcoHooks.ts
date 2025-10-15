import { onFolderBeforeDeleteHcmsHook } from "~/folder/onFolderBeforeDeleteHcms.hook.js";
import { onFolderBeforeDeleteFmHook } from "~/folder/onFolderBeforeDeleteFm.hook.js";
import { createFlpHooks } from "~/flp/index.js";

import type { AcoContext } from "~/types.js";

export const createAcoHooks = (context: AcoContext) => {
    onFolderBeforeDeleteHcmsHook(context);
    onFolderBeforeDeleteFmHook(context);

    createFlpHooks(context);
};
