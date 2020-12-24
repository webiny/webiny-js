import { CmsContentModelEntryType, CmsContentModelType } from "@webiny/api-headless-cms/types";

// eslint-disable-next-line
export const beforeCreateHook = async (
    model: CmsContentModelType,
    entry: CmsContentModelEntryType
): Promise<void> => {
    return;
};
