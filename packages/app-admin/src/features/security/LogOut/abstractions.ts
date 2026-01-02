import { createAbstraction } from "@webiny/feature/admin";

export interface ILogOutUseCase {
    execute(): Promise<void>;
}

export const LogOutUseCase = createAbstraction<ILogOutUseCase>("LogOutUseCase");

export namespace LogOutUseCase {
    export type Interface = ILogOutUseCase;
}
