import { CmsContentModelType, CmsContext } from "@webiny/api-headless-cms/types";

type ArgsType = {
    context: CmsContext;
    model: CmsContentModelType;
};
// eslint-disable-next-line
export const afterCreateHook = async (args: ArgsType) => {};
