import { ITrashBinEntryMapper, TrashBinEntry } from "@webiny/app-trash-bin-common";

export class TrashBinEntryMapper implements ITrashBinEntryMapper<TrashBinEntry> {
    toDTO(data: TrashBinEntry) {
        return {
            id: data.id,
            $selectable: true,
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
