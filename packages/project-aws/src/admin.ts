import { AdminExtension } from "@webiny/app-admin/extensions/index.js";
import { AdminAutoInstall } from "./extensions/index.js";

export const Admin = {
    Extension: AdminExtension,
    AutoInstall: AdminAutoInstall.ReactComponent
};
