import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils/index.js";
import { APPS_SYNC_SYSTEM_PATH } from "./constants.js";
import type { IGetSyncSystemOutputResult } from "~/apps/syncSystem/types.js";

export interface IGetSyncSystemOutputParams {
    env: string;
}

export const getSyncSystemOutput = (params: IGetSyncSystemOutputParams) => {
    return getStackOutput<IGetSyncSystemOutputResult>({
        env: params.env,
        /**
         * Sync System cannot have a variant, only env.
         */
        variant: undefined,
        folder: APPS_SYNC_SYSTEM_PATH
    });
};

export const asyncGetSyncSystemOutput = async (
    params: IGetSyncSystemOutputParams
): Promise<IGetSyncSystemOutputResult> => {
    return new Promise(resolve => {
        const value = getSyncSystemOutput(params);

        return resolve(value);
    });
};
