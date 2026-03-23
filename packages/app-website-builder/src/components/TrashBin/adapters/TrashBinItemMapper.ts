import type { ITrashBinItemMapper, TrashBinItemDTO } from "@webiny/app-trash-bin";
import { Page } from "~/domain/Page/index.js";

export class TrashBinItemMapper implements ITrashBinItemMapper<Page> {
    toDTO(data: Page): TrashBinItemDTO {
        return {
            id: data.entryId,
            title: data.properties.title,
            location: data.location,
            createdBy: data.createdBy,
            deletedBy: {
                id: data.modifiedBy?.id || "",
                displayName: data.modifiedBy?.displayName || "",
                type: data.modifiedBy?.type || ""
            },
            deletedOn: data.modifiedOn || ""
        };
    }
}
