import type {
    ITrashBinListGateway,
    ITrashBinListGatewayParams,
    ITrashBinListGatewayResult,
    ITrashBinDeleteGateway,
    ITrashBinRestoreGateway,
    ITrashBinBulkActionGateway,
    ITrashBinBulkActionParams,
    ITrashBinBulkActionResult,
    TrashBinItem
} from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import {
    TrashBinListGateway,
    TrashBinDeleteGateway,
    TrashBinRestoreGateway,
    TrashBinBulkActionGateway
} from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import { ListDeletedEntriesUseCase } from "~/features/contentEntry/listDeletedEntries/abstractions.js";
import { RestoreFromTrashUseCase } from "~/features/contentEntry/restoreFromTrash/abstractions.js";
import { PermanentlyDeleteEntryUseCase } from "~/features/contentEntry/permanentlyDeleteEntry/abstractions.js";
import { BulkActionUseCase } from "~/features/contentEntry/bulkAction/abstractions.js";
import { CmsTrashBinItemMapper, type ICmsTrashBinItemMapper } from "./abstractions.js";

class CmsTrashBinListGatewayAdapterImpl implements ITrashBinListGateway {
    constructor(
        private listDeletedEntriesUseCase: ListDeletedEntriesUseCase.Interface,
        private itemMapper: ICmsTrashBinItemMapper,
        private modelAccessor: CmsModelContext.Interface
    ) {}

    async execute(params: ITrashBinListGatewayParams): Promise<ITrashBinListGatewayResult> {
        const model = this.modelAccessor.getModel();

        const result = await this.listDeletedEntriesUseCase.execute({
            model,
            where: params.where,
            sort: params.sort,
            limit: params.limit,
            after: params.after,
            search: params.search
        });

        return {
            data: result.data.map(entry => this.itemMapper.toItem(entry)),
            meta: {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            }
        };
    }
}

export const CmsTrashBinListGatewayAdapter = TrashBinListGateway.createImplementation({
    implementation: CmsTrashBinListGatewayAdapterImpl,
    dependencies: [ListDeletedEntriesUseCase, CmsTrashBinItemMapper, CmsModelContext]
});

class CmsTrashBinDeleteGatewayAdapterImpl implements ITrashBinDeleteGateway {
    constructor(
        private permanentlyDeleteUseCase: PermanentlyDeleteEntryUseCase.Interface,
        private modelAccessor: CmsModelContext.Interface
    ) {}

    async execute(id: string): Promise<boolean> {
        const model = this.modelAccessor.getModel();
        return this.permanentlyDeleteUseCase.execute({ model, id });
    }
}

export const CmsTrashBinDeleteGatewayAdapter = TrashBinDeleteGateway.createImplementation({
    implementation: CmsTrashBinDeleteGatewayAdapterImpl,
    dependencies: [PermanentlyDeleteEntryUseCase, CmsModelContext]
});

class CmsTrashBinRestoreGatewayAdapterImpl implements ITrashBinRestoreGateway {
    constructor(
        private restoreFromTrashUseCase: RestoreFromTrashUseCase.Interface,
        private itemMapper: ICmsTrashBinItemMapper,
        private modelAccessor: CmsModelContext.Interface
    ) {}

    async execute(id: string): Promise<TrashBinItem> {
        const model = this.modelAccessor.getModel();
        const entry = await this.restoreFromTrashUseCase.execute({ model, id });
        return this.itemMapper.toItem(entry);
    }
}

export const CmsTrashBinRestoreGatewayAdapter = TrashBinRestoreGateway.createImplementation({
    implementation: CmsTrashBinRestoreGatewayAdapterImpl,
    dependencies: [RestoreFromTrashUseCase, CmsTrashBinItemMapper, CmsModelContext]
});

class CmsTrashBinBulkActionGatewayAdapterImpl implements ITrashBinBulkActionGateway {
    constructor(
        private bulkActionUseCase: BulkActionUseCase.Interface,
        private modelAccessor: CmsModelContext.Interface
    ) {}

    async execute(params: ITrashBinBulkActionParams): Promise<ITrashBinBulkActionResult> {
        const model = this.modelAccessor.getModel();

        return this.bulkActionUseCase.execute({
            model,
            action: params.action,
            where: params.where,
            search: params.search
        });
    }
}

export const CmsTrashBinBulkActionGatewayAdapter = TrashBinBulkActionGateway.createImplementation({
    implementation: CmsTrashBinBulkActionGatewayAdapterImpl,
    dependencies: [BulkActionUseCase, CmsModelContext]
});
