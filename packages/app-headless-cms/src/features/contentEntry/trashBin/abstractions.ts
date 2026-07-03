import { createAbstraction } from "@webiny/feature/admin";
import type { TrashBinItem } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import type { CmsContentEntry } from "~/types.js";

export interface ICmsTrashBinItemMapper {
    toItem(entry: CmsContentEntry): TrashBinItem;
}

export const CmsTrashBinItemMapper =
    createAbstraction<ICmsTrashBinItemMapper>("CmsTrashBinItemMapper");

export namespace CmsTrashBinItemMapper {
    export type Interface = ICmsTrashBinItemMapper;
}
