import { type IGenericError, type IGenericMeta, type IWorkflowState } from "~/types.js";
import type { IWorkflowStateListGatewayListParams } from "~/Gateways/index.js";

export type WorkflowStateListRepositoryType = "own" | "requested" | undefined;

export type IWorkflowStateListRepositoryListParams = IWorkflowStateListGatewayListParams;

export interface IWorkflowStateListRepository {
    items: IWorkflowState[];
    meta: IGenericMeta | null;
    error: IGenericError | null;
    loading: boolean;
    type: WorkflowStateListRepositoryType;
    list(params?: IWorkflowStateListRepositoryListParams): Promise<void>;
    setType(type: WorkflowStateListRepositoryType): void;
}
