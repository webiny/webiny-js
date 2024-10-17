import { TrashBinBulkActionsParams } from "~/types";

export interface IBulkActionUseCase {
    execute: (action: string, params: TrashBinBulkActionsParams) => Promise<void>;
}
