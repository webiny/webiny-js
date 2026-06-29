import { createAbstraction } from "@webiny/feature/admin";
import type { IListUsersGatewayResult } from "./ListUsersGateway.js";

export type IListUsersUseCaseResult = IListUsersGatewayResult;

export interface IListUsersUseCase {
    execute(): Promise<IListUsersUseCaseResult[]>;
}

export const ListUsersUseCase = createAbstraction<IListUsersUseCase>("ListUsersUseCase");

export namespace ListUsersUseCase {
    export type Interface = IListUsersUseCase;
    export type Result = IListUsersUseCaseResult;
}
