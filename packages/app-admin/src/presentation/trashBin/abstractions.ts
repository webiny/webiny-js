import { createAbstraction } from "@webiny/feature/admin";
import type {
    IListViewModel,
    IListActions,
    IDataSourceMeta
} from "~/presentation/listPresenter/abstractions.js";

// ---------------------------------------------------------------------------
// TrashBinItem — universal row type
// ---------------------------------------------------------------------------

export interface TrashBinIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface TrashBinLocation {
    folderId: string | undefined;
}

export interface TrashBinItem {
    id: string;
    title: string;
    location: TrashBinLocation;
    createdBy: TrashBinIdentity;
    deletedBy: TrashBinIdentity;
    deletedOn: string;
    [key: string]: any;
}

// ---------------------------------------------------------------------------
// Gateway abstractions
// ---------------------------------------------------------------------------

export interface ITrashBinListGatewayParams {
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface ITrashBinListGatewayResult {
    data: TrashBinItem[];
    meta: IDataSourceMeta;
}

export interface ITrashBinListGateway {
    execute(params: ITrashBinListGatewayParams): Promise<ITrashBinListGatewayResult>;
}

export const TrashBinListGateway = createAbstraction<ITrashBinListGateway>("TrashBinListGateway");

export namespace TrashBinListGateway {
    export type Interface = ITrashBinListGateway;
    export type Params = ITrashBinListGatewayParams;
    export type Result = ITrashBinListGatewayResult;
}

export interface ITrashBinDeleteGateway {
    execute(id: string): Promise<boolean>;
}

export const TrashBinDeleteGateway =
    createAbstraction<ITrashBinDeleteGateway>("TrashBinDeleteGateway");

export namespace TrashBinDeleteGateway {
    export type Interface = ITrashBinDeleteGateway;
}

export interface ITrashBinRestoreGateway {
    execute(id: string): Promise<TrashBinItem>;
}

export const TrashBinRestoreGateway =
    createAbstraction<ITrashBinRestoreGateway>("TrashBinRestoreGateway");

export namespace TrashBinRestoreGateway {
    export type Interface = ITrashBinRestoreGateway;
}

export interface ITrashBinBulkActionParams {
    action: string;
    where?: Record<string, unknown>;
    search?: string;
}

export interface ITrashBinBulkActionResult {
    id: string;
}

export interface ITrashBinBulkActionGateway {
    execute(params: ITrashBinBulkActionParams): Promise<ITrashBinBulkActionResult>;
}

export const TrashBinBulkActionGateway = createAbstraction<ITrashBinBulkActionGateway>(
    "TrashBinBulkActionGateway"
);

export namespace TrashBinBulkActionGateway {
    export type Interface = ITrashBinBulkActionGateway;
    export type Params = ITrashBinBulkActionParams;
    export type Result = ITrashBinBulkActionResult;
}

// ---------------------------------------------------------------------------
// Presenter abstraction
// ---------------------------------------------------------------------------

export interface ITrashBinPresenterConfig {
    nameColumnId: string;
    initialSort?: { field: string; direction: "ASC" | "DESC" };
}

export interface ITrashBinViewModel {
    list: IListViewModel<TrashBinItem>;
    nameColumnId: string;
}

export interface ITrashBinActions extends IListActions {
    restoreItem(id: string): Promise<void>;
    deleteItem(id: string): Promise<void>;
    bulkRestore(params?: { where?: Record<string, unknown>; search?: string }): Promise<void>;
    bulkDelete(params?: { where?: Record<string, unknown>; search?: string }): Promise<void>;
}

export interface ITrashBinPresenter {
    vm: ITrashBinViewModel;
    actions: ITrashBinActions;
    init(config: ITrashBinPresenterConfig): void;
    dispose(): void;
}

export const TrashBinPresenter = createAbstraction<ITrashBinPresenter>("TrashBinPresenter");

export namespace TrashBinPresenter {
    export type Interface = ITrashBinPresenter;
    export type ViewModel = ITrashBinViewModel;
    export type Actions = ITrashBinActions;
    export type Config = ITrashBinPresenterConfig;
}
