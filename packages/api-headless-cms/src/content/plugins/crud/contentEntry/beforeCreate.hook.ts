import {
    CmsContentEntryType,
    CmsContentModelType,
    CmsContext
} from "@webiny/api-headless-cms/types";
import { markLockedFields } from "./markLockedFields";

type ArgsType = {
    model: CmsContentModelType;
    entry: CmsContentEntryType;
    context: CmsContext;
};
export const beforeCreateHook = async (args: ArgsType): Promise<void> => {
    await markLockedFields(args);
};
