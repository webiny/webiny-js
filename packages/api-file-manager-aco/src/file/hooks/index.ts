import { onFileAfterCreateHook } from "~/file/hooks/onFileAfterCreate.hook";
import { onFileAfterDeleteHook } from "~/file/hooks/onFileAfterDelete.hook";
import { onFileAfterUpdateHook } from "~/file/hooks/onFileAfterUpdate.hook";

import { FmAcoContext } from "~/types";

export const createFileHooks = (context: FmAcoContext) => {
    onFileAfterCreateHook(context);
    onFileAfterDeleteHook(context);
    onFileAfterUpdateHook(context);
};
