import { ITrashBinEntryMapper } from "~/abstractions";
import { TrashBinEntry } from "./TrashBinEntry";

export class TrashBinEntryMapper implements ITrashBinEntryMapper<TrashBinEntry> {
    toDTO(data: TrashBinEntry) {
        return {
            id: data.id,
            title: data.title,
            createdBy: data.createdBy,
            deletedBy: {
                id: data.deletedBy?.id || "",
                displayName: data.deletedBy?.displayName || "",
                type: data.deletedBy?.type || ""
            },
            deletedOn: data.deletedOn || ""
        };
    }
}
