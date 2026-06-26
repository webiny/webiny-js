import { createAbstraction } from "@webiny/feature/admin";
import type { BulkActionViewModel } from "@webiny/app-admin/components/BulkActions/BulkActionRunner.js";
import type { Page } from "~/domain/Page/Page.js";

export type { BulkActionViewModel };

export interface IBulkPublishPresenter {
    vm: BulkActionViewModel;
    execute(items: Page[]): Promise<void>;
}

export const BulkPublishPresenter =
    createAbstraction<IBulkPublishPresenter>("WB/BulkPublishPresenter");

export namespace BulkPublishPresenter {
    export type Interface = IBulkPublishPresenter;
}

export interface IBulkUnpublishPresenter {
    vm: BulkActionViewModel;
    execute(items: Page[]): Promise<void>;
}

export const BulkUnpublishPresenter = createAbstraction<IBulkUnpublishPresenter>(
    "WB/BulkUnpublishPresenter"
);

export namespace BulkUnpublishPresenter {
    export type Interface = IBulkUnpublishPresenter;
}

export interface IBulkDeletePresenter {
    vm: BulkActionViewModel;
    execute(items: Page[]): Promise<void>;
}

export const BulkDeletePresenter =
    createAbstraction<IBulkDeletePresenter>("WB/BulkDeletePresenter");

export namespace BulkDeletePresenter {
    export type Interface = IBulkDeletePresenter;
}

export interface IBulkDuplicatePresenter {
    vm: BulkActionViewModel;
    execute(items: Page[]): Promise<void>;
}

export const BulkDuplicatePresenter = createAbstraction<IBulkDuplicatePresenter>(
    "WB/BulkDuplicatePresenter"
);

export namespace BulkDuplicatePresenter {
    export type Interface = IBulkDuplicatePresenter;
}

export interface IBulkMovePresenter {
    vm: BulkActionViewModel;
    execute(items: Page[], folderId: string): Promise<void>;
}

export const BulkMovePresenter = createAbstraction<IBulkMovePresenter>("WB/BulkMovePresenter");

export namespace BulkMovePresenter {
    export type Interface = IBulkMovePresenter;
}
