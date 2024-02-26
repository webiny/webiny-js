import { onFolderBeforeDeleteAcoHook } from "~/folder/onFolderBeforeDeleteAco.hook";
import { onFolderBeforeDeleteHcmsHook } from "~/folder/onFolderBeforeDeleteHcms.hook";
import { onFolderBeforeDeleteFmHook } from "~/folder/onFolderBeforeDeleteFm.hook";

import { AcoContext } from "~/types";

export const createAcoHooks = (context: AcoContext) => {
    onFolderBeforeDeleteAcoHook(context);
    onFolderBeforeDeleteHcmsHook(context);
    onFolderBeforeDeleteFmHook(context);
};
