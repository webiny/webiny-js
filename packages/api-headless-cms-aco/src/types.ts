import { AcoContext } from "@webiny/api-aco/types";
import { CmsContext, CmsEntryStatus, CmsIdentity } from "@webiny/api-headless-cms/types";

export interface CmsAcoContext extends AcoContext, CmsContext {}

export interface CmsEntryRecordData {
    image?: string | null;
    createdBy: CmsIdentity;
    createdOn: string;
    savedOn: string;
    status: CmsEntryStatus;
    version: number;
    locked: boolean;
}
