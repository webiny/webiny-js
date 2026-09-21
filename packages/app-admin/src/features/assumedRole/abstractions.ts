import { createAbstraction } from "@webiny/feature/admin";

/**
 * The role or team the Admin is currently previewing. `name` is carried alongside the id purely so
 * the banner can say whose permissions are in effect without a second query.
 */
export interface IAssumedRole {
    type: "role" | "team";
    id: string;
    name: string;
}

export interface IAssumedRoleContext {
    get(): IAssumedRole | null;
    set(value: IAssumedRole | null): void;
}

export const AssumedRoleContext = createAbstraction<IAssumedRoleContext>("AssumedRoleContext");

export namespace AssumedRoleContext {
    export type Interface = IAssumedRoleContext;
    export type Value = IAssumedRole;
}

export interface IAssumeRoleUseCase {
    execute(value: IAssumedRole | null): Promise<void>;
}

export const AssumeRoleUseCase = createAbstraction<IAssumeRoleUseCase>("AssumeRoleUseCase");

export namespace AssumeRoleUseCase {
    export type Interface = IAssumeRoleUseCase;
}
