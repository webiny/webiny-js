/**
 * File not used anymore.
 */
// @ts-nocheck
import { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import lodashOmit from "lodash.omit";

export const cleanDatabaseRecord = <T extends CmsModel | CmsEntry>(
    record: T & { PK?: string; SK?: string; TYPE?: string }
): T => {
    return lodashOmit(record, ["PK", "SK", "TYPE"]) as T;
};
