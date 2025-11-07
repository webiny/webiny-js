import { Abstraction } from "@webiny/di";

export interface IAdminPulumi<TApp> {
    execute(app: TApp): void | Promise<void>;
}

export const AdminPulumi = new Abstraction<IAdminPulumi<unknown>>("AdminPulumi");

export namespace AdminPulumi {
    export type Interface = IAdminPulumi<unknown>;
    export type Params = unknown;
}
