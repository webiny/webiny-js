import {
    CmsContentModelCreateHookPluginArgs,
    CmsContentModelStorageOperations,
    CmsContentModelStorageOperationsAfterCreateArgs,
    CmsContext
} from "../../../../types";
import { runContentModelLifecycleHooks } from "./runContentModelLifecycleHooks";

interface Args extends CmsContentModelStorageOperationsAfterCreateArgs {
    context: CmsContext;
    storageOperations: CmsContentModelStorageOperations;
}

export const afterCreateHook = async (args: Args): Promise<void> => {
    if (args.storageOperations.afterCreate) {
        await args.storageOperations.afterCreate(args);
    }
    await runContentModelLifecycleHooks<CmsContentModelCreateHookPluginArgs>("afterCreate", args);
};
