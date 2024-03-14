import { BinEntryDTO, IBinEntryMapper } from "@webiny/app-bin";
import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";

export class BinEntryMapper implements IBinEntryMapper<CmsContentEntry> {
    toDTO(data: CmsContentEntry): BinEntryDTO {
        return {
            id: data.id,
            modelId: data.modelId,
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
