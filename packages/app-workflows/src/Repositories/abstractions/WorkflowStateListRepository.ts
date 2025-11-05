import type { IGenericError, IGenericMeta, IWorkflowState } from "~/types.js";
import type { IWorkflowStateListGatewayListParams } from "~/Gateways/index.js";

export type IWorkflowStateListRepositoryListParams = IWorkflowStateListGatewayListParams;

export interface IWorkflowStateListRepository {
    items: IWorkflowState[];
    meta: IGenericMeta | null;
    error: IGenericError | null;
    loading: boolean;
    list(params?: IWorkflowStateListRepositoryListParams): Promise<void>;
}
