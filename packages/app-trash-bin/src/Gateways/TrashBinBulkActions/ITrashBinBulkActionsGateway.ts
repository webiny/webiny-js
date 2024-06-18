import { TrashBinBulkActionsParams, TrashBinBulkActionsResponse } from "~/types";

export interface ITrashBinBulkActionsGateway {
    execute: (params: TrashBinBulkActionsParams) => Promise<TrashBinBulkActionsResponse>;
}
