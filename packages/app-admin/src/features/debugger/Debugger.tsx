import React from "react";
import { ReactComponent as DebuggerIcon } from "@webiny/icons/bug_report.svg";
import { AdminConfig } from "~/config/AdminConfig.js";
import { useRouter } from "@webiny/app";
import { AdminLayout } from "~/components/AdminLayout.js";
import { HasPermission } from "~/presentation/security/components/HasPermission.js";
import { DEBUGGER_PERMISSIONS_SCHEMA } from "./permissionsSchema.js";
import { DebuggerView } from "./DebuggerView.js";
import { DebuggerRoutes } from "./routes.js";

const { Menu, Route, Security } = AdminConfig;

/**
 * The `dev-tools` parent menu is declared by the playground packages, which ship with every Admin
 * app, so only the child is declared here.
 */
export const Debugger = () => {
    const router = useRouter();

    return (
        <AdminConfig>
            <Security.Permissions
                name={"debugger"}
                title={"Debugger"}
                description={"Manage debug capture permissions."}
                icon={<DebuggerIcon />}
                schema={DEBUGGER_PERMISSIONS_SCHEMA}
            />

            <HasPermission any={["debugger.*", "debugger.capture"]}>
                <Menu
                    name={"dev-tools.debugger"}
                    parent={"dev-tools"}
                    element={
                        <Menu.Link
                            text={"Debugger"}
                            to={router.getLink(DebuggerRoutes.Debugger)}
                            icon={<Menu.Link.Icon label="Debugger" element={<DebuggerIcon />} />}
                        />
                    }
                />
            </HasPermission>

            <Route
                route={DebuggerRoutes.Debugger}
                element={
                    <AdminLayout title={"Debugger"}>
                        <DebuggerView />
                    </AdminLayout>
                }
            />
        </AdminConfig>
    );
};
