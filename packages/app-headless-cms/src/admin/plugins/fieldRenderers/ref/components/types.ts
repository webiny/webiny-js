import { CmsContentEntryStatusType, CmsModel } from "~/types";

export interface OptionItem {
    id: string;
    entryId: string;
    modelId: string;
    modelName: string;
    name: string;
    published: boolean;
    status: CmsContentEntryStatusType;
}

export interface CmsReferenceContentEntry {
    id: string;
    entryId: string;
    title: string;
    status: CmsContentEntryStatusType;
    model: Pick<CmsModel, "modelId" | "name">;
}

export interface ReferenceDataEntry extends CmsReferenceContentEntry {
    published: string | null;
    latest: string | null;
}
