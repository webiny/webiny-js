import { onFileAfterCreateHook } from "~/file/hooks/onFileAfterCreate.hook";

import { FmAcoContext } from "~/types";

export const createFileHooks = (context: FmAcoContext) => {
    onFileAfterCreateHook(context);
};
