import { Entry, EntryDTO, EntryReference } from "./Entry";

export class EntryMapper {
    static toDTO(entry: Entry | EntryDTO): EntryDTO {
        return {
            id: entry.id,
            entryId: entry.entryId,
            title: entry.title,
            modelId: entry.modelId
        };
    }

    static fromStorage(entry: EntryReference): EntryDTO {
        return {
            id: entry.id,
            entryId: entry.entryId,
            title: entry.title,
            modelId: entry.model.modelId
        };
    }
}
