import { createAbstraction } from "@webiny/feature/admin";
import type { GetStepRunGatewayParams } from "~/review/gateway/params.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";

export type GetStepRunUseCaseParams = GetStepRunGatewayParams;

/*
 * What happened in one run of an automated step, or `null` when its task record is gone (R257, a
 * value, not an error). Throws a `GraphQLOperationError` for a server error and the transport
 * `Error` as is (R360).
 */
export interface IGetStepRunUseCase {
    execute(params: GetStepRunUseCaseParams): Promise<ReviewStepRunInfo | null>;
}

export const GetStepRunUseCase = createAbstraction<IGetStepRunUseCase>(
    "Workflows/GetStepRunUseCase"
);

export namespace GetStepRunUseCase {
    export type Interface = IGetStepRunUseCase;
    export type Params = GetStepRunUseCaseParams;
}
