import type { ICmsEntryRevisionSimple, IGenericError } from "../../types.js";

export interface IContentEntriesRepository {
    error: IGenericError | null;
    loading: boolean;
    items: ICmsEntryRevisionSimple[];
    list(revisions: string[]): Promise<void>;
}
