import { TrashBinBulkActionsParams } from "~/types";

export interface IBulkActionUseCase {
    execute: (params: TrashBinBulkActionsParams) => Promise<void>;
}
