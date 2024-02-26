import { CmsContentEntryStatusType, CmsIdentity, CmsModel } from "~/types";

export interface OptionItem {
    id: string;
    entryId: string;
    modelId: string;
    modelName: string;
    name: string;
    published: string | null;
    latest: string | null;
    status: CmsContentEntryStatusType;
    folderId?: string;
}

export interface OptionItemCollection {
    [key: string]: OptionItem;
}

export interface CmsReferenceContentEntry {
    id: string;
    entryId: string;
    title: string;
    description?: string | null;
    image?: string | null;
    status: CmsContentEntryStatusType;
    model: Pick<CmsModel, "modelId" | "name">;
    createdBy: CmsIdentity;
    modifiedBy?: CmsIdentity | null;
    published?: {
        id: string;
        entryId: string;
        title: string;
    };
    wbyAco_location?: {
        folderId?: string;
    };
    createdOn: Date;
    savedOn: Date;
}

export interface CmsReferenceValue {
    id: string;
    modelId: string;
    title?: string;
}
