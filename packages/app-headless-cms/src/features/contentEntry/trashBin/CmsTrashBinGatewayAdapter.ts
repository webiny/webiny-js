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
import type { CmsModel } from "~/types.js";
import type { ICmsTrashBinListGateway } from "./abstractions.js";
import type { ICmsTrashBinDeleteGateway } from "./abstractions.js";
import type { ICmsTrashBinRestoreGateway } from "./abstractions.js";
import type { ICmsTrashBinBulkActionGateway } from "./abstractions.js";
import type { ICmsTrashBinItemMapper } from "./abstractions.js";
import {
    CmsTrashBinListGateway,
    CmsTrashBinDeleteGateway,
    CmsTrashBinRestoreGateway,
    CmsTrashBinBulkActionGateway,
    CmsTrashBinItemMapper
} from "./abstractions.js";

class CmsTrashBinListGatewayAdapterImpl implements ITrashBinListGateway {
    private _model: CmsModel | null = null;

    constructor(
        private cmsListGateway: ICmsTrashBinListGateway,
        private itemMapper: ICmsTrashBinItemMapper
    ) {}

    setModel(model: CmsModel) {
        this._model = model;
    }

    async execute(params: ITrashBinListGatewayParams): Promise<ITrashBinListGatewayResult> {
        if (!this._model) {
            throw new Error("CMS model not set on trash bin list gateway adapter.");
        }

        const result = await this.cmsListGateway.execute({
            model: this._model,
            where: params.where,
            sort: params.sort,
            limit: params.limit,
            after: params.after,
            search: params.search
        });

        return {
            data: result.data.map(entry => this.itemMapper.toItem(entry)),
            meta: result.meta
        };
    }
}

export const CmsTrashBinListGatewayAdapter = TrashBinListGateway.createImplementation({
    implementation: CmsTrashBinListGatewayAdapterImpl,
    dependencies: [CmsTrashBinListGateway, CmsTrashBinItemMapper]
});

class CmsTrashBinDeleteGatewayAdapterImpl implements ITrashBinDeleteGateway {
    private _model: CmsModel | null = null;

    constructor(private cmsDeleteGateway: ICmsTrashBinDeleteGateway) {}

    setModel(model: CmsModel) {
        this._model = model;
    }

    async execute(id: string): Promise<boolean> {
        if (!this._model) {
            throw new Error("CMS model not set on trash bin delete gateway adapter.");
        }

        return this.cmsDeleteGateway.execute({ model: this._model, id });
    }
}

export const CmsTrashBinDeleteGatewayAdapter = TrashBinDeleteGateway.createImplementation({
    implementation: CmsTrashBinDeleteGatewayAdapterImpl,
    dependencies: [CmsTrashBinDeleteGateway]
});

class CmsTrashBinRestoreGatewayAdapterImpl implements ITrashBinRestoreGateway {
    private _model: CmsModel | null = null;

    constructor(
        private cmsRestoreGateway: ICmsTrashBinRestoreGateway,
        private itemMapper: ICmsTrashBinItemMapper
    ) {}

    setModel(model: CmsModel) {
        this._model = model;
    }

    async execute(id: string): Promise<TrashBinItem> {
        if (!this._model) {
            throw new Error("CMS model not set on trash bin restore gateway adapter.");
        }

        const entry = await this.cmsRestoreGateway.execute({ model: this._model, id });
        return this.itemMapper.toItem(entry);
    }
}

export const CmsTrashBinRestoreGatewayAdapter = TrashBinRestoreGateway.createImplementation({
    implementation: CmsTrashBinRestoreGatewayAdapterImpl,
    dependencies: [CmsTrashBinRestoreGateway, CmsTrashBinItemMapper]
});

class CmsTrashBinBulkActionGatewayAdapterImpl implements ITrashBinBulkActionGateway {
    private _model: CmsModel | null = null;

    constructor(private cmsBulkActionGateway: ICmsTrashBinBulkActionGateway) {}

    setModel(model: CmsModel) {
        this._model = model;
    }

    async execute(params: ITrashBinBulkActionParams): Promise<ITrashBinBulkActionResult> {
        if (!this._model) {
            throw new Error("CMS model not set on trash bin bulk action gateway adapter.");
        }

        return this.cmsBulkActionGateway.execute({
            model: this._model,
            action: params.action,
            where: params.where,
            search: params.search
        });
    }
}

export const CmsTrashBinBulkActionGatewayAdapter = TrashBinBulkActionGateway.createImplementation({
    implementation: CmsTrashBinBulkActionGatewayAdapterImpl,
    dependencies: [CmsTrashBinBulkActionGateway]
});
