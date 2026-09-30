import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { AdminConfig } from "~/config/AdminConfig.js";
import { AdminLayout } from "~/components/AdminLayout.js";
import { useCanCaptureDebugData } from "./permissions.js";
import { debuggerStore } from "./DebuggerStore.js";
import { DebuggerView } from "./DebuggerView.js";
import { DebuggerRoutes } from "./routes.js";

/**
 * No menu entry: the header indicator is the way in, and it downloads the report directly. The
 * panel remains reachable by URL for anyone who wants the namespace filter or the session list.
 */
export const Debugger = observer(() => {
    const canDebug = useCanCaptureDebugData();

    /**
     * Holding the permission is the opt-in, so capture starts on. An identity that has explicitly
     * turned it off keeps it off; one that loses the permission has it turned off for them.
     */
    useEffect(() => {
        debuggerStore.applyPermission(canDebug);
    }, [canDebug]);

    return (
        <AdminConfig>
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
