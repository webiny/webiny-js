import { CmsContentEntry, CmsContentModel } from "@webiny/api-headless-cms/types";
import { omit as lodashOmit } from "lodash";

export const cleanDatabaseRecord = <T extends CmsContentModel | CmsContentEntry>(
    record: T & { PK?: string; SK?: string; TYPE?: string }
): T => {
    return lodashOmit(record, ["PK", "SK", "TYPE"]) as T;
};
