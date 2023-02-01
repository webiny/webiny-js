import { ContextPlugin } from "@webiny/api";
import { afterPageCreateHook } from "./pageBuilder/afterPageCreate.hook";
import { afterPageUpdateHook } from "./pageBuilder/afterPageUpdate.hook";
import { afterPageDeleteHook } from "./pageBuilder/afterPageDelete.hook";
import { AcoContext } from "~/types";

export const createSearchRecordHooks = (): ContextPlugin<AcoContext>[] => {
    return [afterPageCreateHook(), afterPageUpdateHook(), afterPageDeleteHook()];
};
