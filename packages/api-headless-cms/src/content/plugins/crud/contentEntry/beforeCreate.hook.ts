import { CmsContentEntry, CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";
import { markLockedFields } from "./markLockedFields";

interface Args {
    model: CmsContentModel;
    entry: CmsContentEntry;
    context: CmsContext;
}
export const beforeCreateHook = async (args: Args): Promise<void> => {
    await markLockedFields(args);
};
