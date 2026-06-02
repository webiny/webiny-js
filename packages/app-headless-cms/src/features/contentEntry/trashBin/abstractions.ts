import { createAbstraction } from "@webiny/feature/admin";
import type { IDataSourceMeta } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { TrashBinItem } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";

// ---------------------------------------------------------------------------
// CMS Trash Bin List Gateway
// ---------------------------------------------------------------------------

export interface ICmsTrashBinListGatewayParams {
    model: CmsModel;
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface ICmsTrashBinListGatewayResult {
    data: CmsContentEntry[];
    meta: IDataSourceMeta;
}

export interface ICmsTrashBinListGateway {
    execute(params: ICmsTrashBinListGatewayParams): Promise<ICmsTrashBinListGatewayResult>;
}

export const CmsTrashBinListGateway =
    createAbstraction<ICmsTrashBinListGateway>("CmsTrashBinListGateway");

export namespace CmsTrashBinListGateway {
    export type Interface = ICmsTrashBinListGateway;
}

// ---------------------------------------------------------------------------
// CMS Trash Bin Delete Gateway
// ---------------------------------------------------------------------------

export interface ICmsTrashBinDeleteGatewayParams {
    model: CmsModel;
    id: string;
}

export interface ICmsTrashBinDeleteGateway {
    execute(params: ICmsTrashBinDeleteGatewayParams): Promise<boolean>;
}

export const CmsTrashBinDeleteGateway = createAbstraction<ICmsTrashBinDeleteGateway>(
    "CmsTrashBinDeleteGateway"
);

export namespace CmsTrashBinDeleteGateway {
    export type Interface = ICmsTrashBinDeleteGateway;
}

// ---------------------------------------------------------------------------
// CMS Trash Bin Restore Gateway
// ---------------------------------------------------------------------------

export interface ICmsTrashBinRestoreGatewayParams {
    model: CmsModel;
    id: string;
}

export interface ICmsTrashBinRestoreGateway {
    execute(params: ICmsTrashBinRestoreGatewayParams): Promise<CmsContentEntry>;
}

export const CmsTrashBinRestoreGateway = createAbstraction<ICmsTrashBinRestoreGateway>(
    "CmsTrashBinRestoreGateway"
);

export namespace CmsTrashBinRestoreGateway {
    export type Interface = ICmsTrashBinRestoreGateway;
}

// ---------------------------------------------------------------------------
// CMS Trash Bin Bulk Action Gateway
// ---------------------------------------------------------------------------

export interface ICmsTrashBinBulkActionGatewayParams {
    model: CmsModel;
    action: string;
    where?: Record<string, unknown>;
    search?: string;
}

export interface ICmsTrashBinBulkActionGatewayResult {
    id: string;
}

export interface ICmsTrashBinBulkActionGateway {
    execute(
        params: ICmsTrashBinBulkActionGatewayParams
    ): Promise<ICmsTrashBinBulkActionGatewayResult>;
}

export const CmsTrashBinBulkActionGateway = createAbstraction<ICmsTrashBinBulkActionGateway>(
    "CmsTrashBinBulkActionGateway"
);

export namespace CmsTrashBinBulkActionGateway {
    export type Interface = ICmsTrashBinBulkActionGateway;
}

// ---------------------------------------------------------------------------
// CMS Trash Bin Item Mapper
// ---------------------------------------------------------------------------

export interface ICmsTrashBinItemMapper {
    toItem(entry: CmsContentEntry): TrashBinItem;
}

export const CmsTrashBinItemMapper =
    createAbstraction<ICmsTrashBinItemMapper>("CmsTrashBinItemMapper");

export namespace CmsTrashBinItemMapper {
    export type Interface = ICmsTrashBinItemMapper;
}
