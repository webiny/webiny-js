import { Entry, EntryDTO } from "./Entry";

export class EntryMapper {
    static toDTO(entry: Entry | EntryDTO): EntryDTO {
        return {
            id: entry.id,
            entryId: entry.entryId,
            title: entry.title
        };
    }
}
