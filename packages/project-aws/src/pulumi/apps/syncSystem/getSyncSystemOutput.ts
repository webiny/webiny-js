import { getStackOutput } from "@webiny/project";
import type { IGetSyncSystemOutputResult } from "~/pulumi/apps/syncSystem/types.js";

export const getSyncSystemOutput = () => {
    return getStackOutput<IGetSyncSystemOutputResult>({
        app: "sync"
    });
};

export const asyncGetSyncSystemOutput = async (): Promise<IGetSyncSystemOutputResult> => {
    const value = await getSyncSystemOutput();
    return value!;
};
