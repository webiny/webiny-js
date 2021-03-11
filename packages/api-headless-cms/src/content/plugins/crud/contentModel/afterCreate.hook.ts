import {
    CmsContentModelCreateHookPluginArgs,
    CmsContentModelCrud,
    CmsContentModelCrudAfterCreateArgs,
    CmsContext
} from "../../../../types";
import { runContentModelLifecycleHooks } from "./runContentModelLifecycleHooks";

interface Args extends CmsContentModelCrudAfterCreateArgs {
    context: CmsContext;
    crud: CmsContentModelCrud;
}

export const afterCreateHook = async (args: Args): Promise<void> => {
    await runContentModelLifecycleHooks<CmsContentModelCreateHookPluginArgs>("afterCreate", args);
};
