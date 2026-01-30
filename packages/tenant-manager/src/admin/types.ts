import { CmsContentEntry } from "@webiny/app-headless-cms/types.js";
import type { TenantValues } from "../shared/Tenant.js";

type BaseEntry = Omit<CmsContentEntry, "values">;

export interface TenantEntry extends BaseEntry {
    values: TenantValues;
}
