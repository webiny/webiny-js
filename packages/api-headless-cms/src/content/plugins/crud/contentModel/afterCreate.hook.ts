import { CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";
import { runContentModelLifecycleHooks } from "./hooks";

interface Args {
    context: CmsContext;
    model: CmsContentModel;
}

export const afterCreateHook = async (args: Args): Promise<void> => {
    await runContentModelLifecycleHooks("afterCreate", args);
};
