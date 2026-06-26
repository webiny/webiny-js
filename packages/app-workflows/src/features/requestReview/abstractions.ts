import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowState } from "~/types.js";

export interface IRequestReviewParams {
    app: string;
    targetRevisionId: string;
    title: string;
}

export interface IRequestReviewGateway {
    execute(params: IRequestReviewParams): Promise<IWorkflowState>;
}

export const RequestReviewGateway =
    createAbstraction<IRequestReviewGateway>("RequestReviewGateway");

export namespace RequestReviewGateway {
    export type Interface = IRequestReviewGateway;
}

export interface IRequestReviewUseCase {
    execute(params: IRequestReviewParams): Promise<IWorkflowState>;
}

export const RequestReviewUseCase =
    createAbstraction<IRequestReviewUseCase>("RequestReviewUseCase");

export namespace RequestReviewUseCase {
    export type Interface = IRequestReviewUseCase;
}
