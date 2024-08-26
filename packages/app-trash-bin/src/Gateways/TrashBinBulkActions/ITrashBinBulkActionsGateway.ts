import { TrashBinBulkActionsGatewayParams, TrashBinBulkActionsResponse } from "~/types";

export interface ITrashBinBulkActionsGateway {
    execute: (params: TrashBinBulkActionsGatewayParams) => Promise<TrashBinBulkActionsResponse>;
}
