import { TrashBinEntryDTO, ITrashBinEntryMapper } from "@webiny/app-trash-bin-common";
import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";

export class TrashBinEntryMapper implements ITrashBinEntryMapper<CmsContentEntry> {
    toDTO(data: CmsContentEntry): TrashBinEntryDTO {
        return {
            id: data.entryId,
            title: data.meta.title,
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
