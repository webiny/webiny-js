import { createAbstraction } from "@webiny/feature/admin";
import type { BulkActionViewModel } from "@webiny/app-admin/components/BulkActions/BulkActionRunner.js";
import type { CmsContentEntry } from "~/types.js";

export type { BulkActionViewModel };

export interface IBulkPublishPresenter {
    vm: BulkActionViewModel;
    execute(items: CmsContentEntry[], allSelected: boolean): Promise<void>;
}

export const BulkPublishPresenter =
    createAbstraction<IBulkPublishPresenter>("BulkPublishPresenter");

export namespace BulkPublishPresenter {
    export type Interface = IBulkPublishPresenter;
}

export interface IBulkUnpublishPresenter {
    vm: BulkActionViewModel;
    execute(items: CmsContentEntry[], allSelected: boolean): Promise<void>;
}

export const BulkUnpublishPresenter =
    createAbstraction<IBulkUnpublishPresenter>("BulkUnpublishPresenter");

export namespace BulkUnpublishPresenter {
    export type Interface = IBulkUnpublishPresenter;
}

export interface IBulkDeletePresenter {
    vm: BulkActionViewModel;
    execute(items: CmsContentEntry[], allSelected: boolean): Promise<void>;
}

export const BulkDeletePresenter = createAbstraction<IBulkDeletePresenter>("BulkDeletePresenter");

export namespace BulkDeletePresenter {
    export type Interface = IBulkDeletePresenter;
}

export interface IBulkMovePresenter {
    vm: BulkActionViewModel;
    execute(items: CmsContentEntry[], allSelected: boolean, folderId: string): Promise<void>;
}

export const BulkMovePresenter = createAbstraction<IBulkMovePresenter>("BulkMovePresenter");

export namespace BulkMovePresenter {
    export type Interface = IBulkMovePresenter;
}
