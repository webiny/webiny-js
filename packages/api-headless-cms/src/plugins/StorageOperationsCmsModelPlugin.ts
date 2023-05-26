import { Plugin } from "@webiny/plugins";
import { CmsModel, StorageOperationsCmsModel } from "~/types";

export interface StorageOperationsCmsModelPluginCallable {
    (model: CmsModel): StorageOperationsCmsModel;
}

/**
 * This plugin should be initialized only once and hence the name.
 */
export class StorageOperationsCmsModelPlugin extends Plugin {
    public static override readonly type: string = "cms.storageOperations.model";
    public override name = "cms.storageOperations.model";

    private readonly models: Record<string, StorageOperationsCmsModel> = {};
    private readonly cb: StorageOperationsCmsModelPluginCallable;

    public constructor(cb: StorageOperationsCmsModelPluginCallable) {
        super();
        this.cb = cb;
    }

    public getModel(input: CmsModel) {
        const cacheKey = this.createCacheKey(input);
        if (this.models[cacheKey]) {
            return this.models[cacheKey];
        }
        const model = this.cb(input);

        this.models[cacheKey] = model;

        return model;
    }

    /**
     * We can cache the converters by having a cache key that is a combination of model ID and savedOn.
     * The models created via the code will not have savedOn, so they will be unknown - and that is ok as they cannot change in the middle of the call.
     *
     * The models created via the CRUD operations might get changed in the middle of the call, so we need to re-create the SO model.
     */
    private createCacheKey(model: CmsModel): string {
        return [model.tenant, model.locale, model.modelId, model.savedOn || "unknown"].join("#");
    }
}
