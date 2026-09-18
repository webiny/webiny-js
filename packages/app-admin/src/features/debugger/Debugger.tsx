import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as DebuggerIcon } from "@webiny/icons/bug_report.svg";
import { AdminConfig } from "~/config/AdminConfig.js";
import { useRouter } from "@webiny/app";
import { AdminLayout } from "~/components/AdminLayout.js";
import { useDebuggerPermissions } from "./permissions.js";
import { debuggerStore } from "./DebuggerStore.js";
import { DebuggerView } from "./DebuggerView.js";
import { DebuggerRoutes } from "./routes.js";
import { SecurityPermission } from "./SecurityPermission.js";

/**
 * The `dev-tools` parent menu is declared by the playground packages, which ship with every Admin
 * app, so only the child is declared here.
 */
export const Debugger = observer(() => {
    const router = useRouter();
    const { canAccess } = useDebuggerPermissions();
    const canDebug = canAccess("debug");

    /**
     * Holding the permission is the opt-in, so capture starts on. An identity that has explicitly
     * turned it off keeps it off; one that loses the permission has it turned off for them.
     */
    useEffect(() => {
        debuggerStore.applyPermission(canDebug);
    }, [canDebug]);

    return (
        <AdminConfig>
            <SecurityPermission />
            {canDebug ? (
                <AdminConfig.Menu
                    name={"dev-tools.debugger"}
                    parent={"dev-tools"}
                    element={
                        <AdminConfig.Menu.Link
                            text={"Debugger"}
                            to={router.getLink(DebuggerRoutes.Debugger)}
                            icon={
                                <AdminConfig.Menu.Link.Icon
                                    label="Debugger"
                                    element={<DebuggerIcon />}
                                />
                            }
                        />
                    }
                />
            ) : null}

            <AdminConfig.Route
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
