import { CmsContentEntry, CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";

interface Args {
    model: CmsContentModel;
    entry: CmsContentEntry;
    context: CmsContext;
}
// eslint-disable-next-line
export const afterSaveHook = async (args: Args): Promise<void> => {
    return;
};
