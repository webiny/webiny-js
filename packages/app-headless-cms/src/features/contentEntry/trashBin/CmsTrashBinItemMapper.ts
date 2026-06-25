import type { TrashBinItem } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import type { CmsContentEntry } from "~/types.js";
import {
    CmsTrashBinItemMapper as Abstraction,
    type ICmsTrashBinItemMapper
} from "./abstractions.js";

class CmsTrashBinItemMapperImpl implements ICmsTrashBinItemMapper {
    toItem(entry: CmsContentEntry): TrashBinItem {
        return {
            id: entry.entryId,
            title: entry.meta.title,
            location: entry.wbyAco_location,
            createdBy: entry.createdBy,
            deletedBy: {
                id: entry.deletedBy?.id || "",
                displayName: entry.deletedBy?.displayName || "",
                type: entry.deletedBy?.type || ""
            },
            deletedOn: entry.deletedOn || ""
        };
    }
}

export const CmsTrashBinItemMapper = Abstraction.createImplementation({
    implementation: CmsTrashBinItemMapperImpl,
    dependencies: []
});
