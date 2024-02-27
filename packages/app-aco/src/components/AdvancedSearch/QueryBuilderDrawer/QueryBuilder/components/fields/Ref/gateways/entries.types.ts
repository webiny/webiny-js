import { AcoError } from "~/types";
import { EntryReference } from "../domain";

export interface ListEntriesQueryVariables {
    modelIds: string[];
    query?: string;
    limit?: number;
}

export interface ListEntriesResponse {
    searchContentEntries: {
        data: EntryReference[] | null;
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
        data: EntryReference | null;
        error: AcoError | null;
    };
}
