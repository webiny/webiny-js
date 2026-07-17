// packages/api-headless-cms-pg-os/src/types.ts
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";

export type { CmsContext };

export interface ISyncRow {
    id: string;
    entryId: string;
    index: string;
    operation: string;
    data: string;
    tenant: string;
}
