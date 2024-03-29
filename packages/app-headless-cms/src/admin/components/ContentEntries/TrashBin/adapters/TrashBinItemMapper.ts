import { TrashBinItemDTO, ITrashBinItemMapper } from "@webiny/app-trash-bin-common";
import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";

export class TrashBinItemMapper implements ITrashBinItemMapper<CmsContentEntry> {
    toDTO(data: CmsContentEntry): TrashBinItemDTO {
        return {
            id: data.entryId,
            title: data.meta.title,
            location: data.wbyAco_location,
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
