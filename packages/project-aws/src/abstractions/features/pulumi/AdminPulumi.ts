import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import type { AdminPulumiApp } from "~/pulumi/apps/admin/createAdminPulumiApp.js";

export interface IAdminPulumi {
    execute(app: AdminPulumiApp): void | Promise<void>;
}

export const AdminPulumi = createAbstraction<IAdminPulumi>("AdminPulumi");

export namespace AdminPulumi {
    export type Interface = IAdminPulumi;
    export type Params = AdminPulumiApp;
}
