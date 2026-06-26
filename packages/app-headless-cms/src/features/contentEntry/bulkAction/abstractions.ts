import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel } from "~/types.js";

export interface IBulkActionParams {
    model: CmsModel;
    action: string;
    where?: Record<string, unknown>;
    search?: string;
    data?: Record<string, unknown>;
}

export interface IBulkActionResult {
    id: string;
}

export interface IBulkActionGateway {
    execute(params: IBulkActionParams): Promise<IBulkActionResult>;
}

export const BulkActionGateway = createAbstraction<IBulkActionGateway>("BulkActionGateway");

export namespace BulkActionGateway {
    export type Interface = IBulkActionGateway;
}

export interface IBulkActionRepository {
    execute(params: IBulkActionParams): Promise<IBulkActionResult>;
}

export const BulkActionRepository =
    createAbstraction<IBulkActionRepository>("BulkActionRepository");

export namespace BulkActionRepository {
    export type Interface = IBulkActionRepository;
}

export interface IBulkActionUseCase {
    execute(params: IBulkActionParams): Promise<IBulkActionResult>;
}

export const BulkActionUseCase = createAbstraction<IBulkActionUseCase>("BulkActionUseCase");

export namespace BulkActionUseCase {
    export type Interface = IBulkActionUseCase;
}
