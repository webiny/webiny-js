import { IBinEntryMapper } from "~/abstractions";
import { BinEntry } from "./BinEntry";

export class BinEntryMapper implements IBinEntryMapper<BinEntry> {
    toDTO(data: BinEntry) {
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
