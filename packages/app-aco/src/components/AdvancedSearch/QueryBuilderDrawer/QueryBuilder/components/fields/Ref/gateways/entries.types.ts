import { AcoError } from "~/types";

export interface CmsReferenceContentEntry {
    id: string;
    entryId: string;
    title: string;
}

export interface ListEntriesQueryVariables {
    modelIds: string[];
    query?: string;
    limit?: number;
}

export interface ListEntriesResponse {
    searchContentEntries: {
        data: CmsReferenceContentEntry[] | null;
        error: AcoError | null;
    };
}

export interface GetEntryQueryVariables {
    entry: {
        modelId: string;
        id: string;
    };
}

export interface GetEntryResponse {
    getLatestContentEntry: {
        data: CmsReferenceContentEntry | null;
        error: AcoError | null;
    };
}
