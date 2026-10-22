import { createAbstraction } from "@webiny/feature/admin";

export interface IDeleteUserUseCaseParams {
    id: string;
}

export interface IDeleteUserUseCase {
    execute(params: IDeleteUserUseCaseParams): Promise<boolean>;
}

export const DeleteUserUseCase = createAbstraction<IDeleteUserUseCase>("DeleteUserUseCase");

export namespace DeleteUserUseCase {
    export type Interface = IDeleteUserUseCase;
    export type Params = IDeleteUserUseCaseParams;
}
