import { onEntryBeforeRestoreHook } from "~/hooks/entry/onEntryBeforeRestore.hook";

export { onEntryBeforeRestoreHook } from "./onEntryBeforeRestore.hook";

import { HcmsAcoContext } from "~/types";

export const createEntryHooks = (context: HcmsAcoContext) => {
    onEntryBeforeRestoreHook(context);
};
