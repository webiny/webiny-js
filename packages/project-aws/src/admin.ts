import { AdminExtension, AdminBuildParam } from "@webiny/app-admin/extensions/index.js";
import { WcpAdminExtension } from "./components/WcpAdmin.js";

export const Admin = {
    Extension: AdminExtension,
    BuildParam: AdminBuildParam,
    Wcp: WcpAdminExtension
};
