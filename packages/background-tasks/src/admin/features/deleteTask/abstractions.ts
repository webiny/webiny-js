import { createAbstraction } from "@webiny/feature/admin";

export interface IDeleteTaskGateway {
    execute(id: string): Promise<boolean>;
}

export const DeleteTaskGateway = createAbstraction<IDeleteTaskGateway>("DeleteTaskGateway");

export namespace DeleteTaskGateway {
    export type Interface = IDeleteTaskGateway;
}

export interface IDeleteTaskUseCase {
    execute(id: string): Promise<boolean>;
}

export const DeleteTaskUseCase = createAbstraction<IDeleteTaskUseCase>("DeleteTaskUseCase");

export namespace DeleteTaskUseCase {
    export type Interface = IDeleteTaskUseCase;
}
