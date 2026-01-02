import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import type { AdminPulumiApp } from "~/pulumi/apps/admin/index.js";

export interface IAdminPulumi<TApp = AdminPulumiApp> {
    execute(app: TApp): void | Promise<void>;
}

export const AdminPulumi = createAbstraction<IAdminPulumi<AdminPulumiApp>>("AdminPulumi");

export namespace AdminPulumi {
    export type Interface = IAdminPulumi<AdminPulumiApp>;
    export type Params = AdminPulumiApp;
}
