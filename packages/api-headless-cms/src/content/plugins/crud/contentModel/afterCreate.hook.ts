import { CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";

interface Args {
    context: CmsContext;
    model: CmsContentModel;
}
// eslint-disable-next-line
export const afterCreateHook = async (args: Args) => {};
