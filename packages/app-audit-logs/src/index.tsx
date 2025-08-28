import React from "react";
import { ReactComponent as Icon } from "@webiny/icons/manage_search.svg";
import { AdminConfig, Layout, useWcp } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-security";
import { LogsModule } from "~/views/Logs/LogsModule";
import { AuditLogsPermissions } from "~/plugins/permissionRenderer";
import AuditLogsView from "~/views/Logs/Logs";

const { Menu, Route } = AdminConfig;

export const AuditLogs = () => {
    const wcp = useWcp();

    if (!wcp.canUseAuditLogs()) {
        return null;
    }

    return (
        <>
            <LogsModule />
            <AdminConfig>
                <HasPermission any={["al.*"]}>
                    <Menu
                        name="auditLogs"
                        element={
                            <Menu.Link
                                text={"Audit Logs"}
                                icon={<Menu.Link.Icon element={<Icon />} label={"Audit Logs"} />}
                                to={"/audit-logs"}
                            />
                        }
                    />
                    <Route
                        name={"auditLogs"}
                        exact
                        path={"/audit-logs"}
                        element={
                            <Layout title={"Audit Logs - Logs"}>
                                <AuditLogsView />
                            </Layout>
                        }
                    />
                </HasPermission>
            </AdminConfig>
            <AuditLogsPermissions />
        </>
    );
};
