import { ITrashBinItemMapper, TrashBinItem } from "@webiny/app-trash-bin-common";

export class TrashBinItemMapper implements ITrashBinItemMapper<TrashBinItem> {
    toDTO(data: TrashBinItem) {
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
