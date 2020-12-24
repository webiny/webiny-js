import {
    CmsContentModelEntryType,
    CmsContentModelType,
    CmsContext
} from "@webiny/api-headless-cms/types";

type ArgsType = {
    model: CmsContentModelType;
    entry: CmsContentModelEntryType;
    context: CmsContext;
};
// eslint-disable-next-line
export const afterSaveHook = async (args: ArgsType): Promise<void> => {
    return;
};
