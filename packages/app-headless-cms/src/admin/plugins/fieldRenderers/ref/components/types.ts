import { CmsContentEntryStatusType, CmsModel } from "~/types";

export interface OptionItem {
    id: string;
    entryId: string;
    modelId: string;
    modelName: string;
    name: string;
    published: string | null;
    latest: string | null;
    status: CmsContentEntryStatusType;
}

export interface OptionItemCollection {
    [key: string]: OptionItem;
}

export interface CmsReferenceContentEntry {
    id: string;
    entryId: string;
    title: string;
    status: CmsContentEntryStatusType;
    model: Pick<CmsModel, "modelId" | "name">;
    published?: {
        id: string;
        entryId: string;
        title: string;
    };
}

// export interface ReferenceDataEntry extends CmsReferenceContentEntry {
//     published: string | null;
//     latest: string | null;
// }
