import { CmsContentModelEntryType, CmsContentModelType } from "@webiny/api-headless-cms/types";

// eslint-disable-next-line
export const afterSaveHook = async (
    model: CmsContentModelType,
    entry: CmsContentModelEntryType
): Promise<void> => {};
