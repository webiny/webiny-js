import {
    CmsContentEntryType,
    CmsContentModelType,
    CmsContext
} from "@webiny/api-headless-cms/types";

type ArgsType = {
    model: CmsContentModelType;
    entry: CmsContentEntryType;
    context: CmsContext;
};
// eslint-disable-next-line
export const afterCreateHook = async (args: ArgsType): Promise<void> => {
    return;
};
