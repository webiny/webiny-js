import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IAdminPulumi<TApp> {
    execute(app: TApp): void | Promise<void>;
}

export const AdminPulumi = createAbstraction<IAdminPulumi<unknown>>("AdminPulumi");

export namespace AdminPulumi {
    export type Interface = IAdminPulumi<unknown>;
    export type Params = unknown;
}
