import type { HcmsBulkActionsContext } from "@webiny/api-headless-cms-bulk-actions/types.js";
import type { AcoContext } from "@webiny/api-aco/types.js";
import type { HeadlessCms } from "@webiny/api-headless-cms/types/index.js";
import type { IDeleteCmsModelTask, IStoreValue } from "~/features/DeleteModelTask/types.js";

export interface HeadlessCmsFullyDeleteModel {
    fullyDeleteModel: (modelId: string) => Promise<IDeleteCmsModelTask>;
    cancelFullyDeleteModel: (modelId: string) => Promise<IDeleteCmsModelTask>;
    getDeleteModelProgress: (modelId: string) => Promise<IDeleteCmsModelTask>;
    isModelBeingDeleted: (modelId: string) => Promise<boolean>;
    listModelsBeingDeleted: () => Promise<IStoreValue[]>;
}

export interface HcmsTasksContext extends HcmsBulkActionsContext, AcoContext {
    cms: HeadlessCms & HeadlessCmsFullyDeleteModel;
}
