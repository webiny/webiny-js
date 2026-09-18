import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as DebuggerIcon } from "@webiny/icons/bug_report.svg";
import { AdminConfig } from "~/config/AdminConfig.js";
import { useRouter } from "@webiny/app";
import { AdminLayout } from "~/components/AdminLayout.js";
import { DEBUGGER_PERMISSIONS_SCHEMA, useDebuggerPermissions } from "./permissions.js";
import { DebuggerView } from "./DebuggerView.js";
import { DebuggerRoutes } from "./routes.js";

const { Menu, Route, Security } = AdminConfig;

/**
 * The `dev-tools` parent menu is declared by the playground packages, which ship with every Admin
 * app, so only the child is declared here.
 */
export const Debugger = observer(() => {
    const router = useRouter();
    const { canAccess } = useDebuggerPermissions();
    const canDebug = canAccess("debug");

    return (
        <AdminConfig>
            <Security.Permissions
                name={"dev-tools-debugger"}
                title={"Debugger"}
                description={"Manage debug capture access."}
                icon={<DebuggerIcon />}
                schema={DEBUGGER_PERMISSIONS_SCHEMA}
            />

            {canDebug ? (
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
            ) : null}

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
});
