import React from "react";
import { useRouter } from "@webiny/app-admin";
import { ReactComponent as Icon } from "@webiny/icons/manage_search.svg";
import { AdminConfig, AdminLayout, RegisterFeature, useFeatureFlags } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-admin";
import { LogsModule } from "~/views/Logs/LogsModule.js";
import { SecurityPermission } from "~/SecurityPermission.js";
import { LogsView } from "~/views/Logs/LogsView.js";
import { AuditLogsListWithConfig } from "~/config/list/index.js";
import { Routes } from "~/routes.js";
import { AlPermissionsFeature } from "~/features/permissions/feature.js";
import { ListAuditLogsFeature } from "~/features/listAuditLogs/index.js";
import { AuditLogDetailsPresenterFeature } from "~/views/Logs/Preview/feature.js";
import { AiPromptPreviewTabs } from "~/views/Logs/Preview/tabs/AiPromptTabs.js";

const { Menu, Route } = AdminConfig;

export const AuditLogs = () => {
    const featureFlags = useFeatureFlags();
    const router = useRouter();

    if (!featureFlags.isAuditLogsEnabled()) {
        return null;
    }

    return (
        <>
            <RegisterFeature feature={AlPermissionsFeature} />
            <RegisterFeature feature={ListAuditLogsFeature} />
            <RegisterFeature feature={AuditLogDetailsPresenterFeature} />
            <LogsModule />
            <SecurityPermission />
            <AiPromptPreviewTabs />
            <AdminConfig>
                <HasPermission any={["al.*"]}>
                    <Menu
                        name="auditLogs"
                        pinnable
                        element={
                            <Menu.Link
                                text={"Audit Logs"}
                                icon={<Menu.Link.Icon element={<Icon />} label={"Audit Logs"} />}
                                to={router.getLink(Routes.AuditLogsList)}
                            />
                        }
                    />
                    <Route
                        route={Routes.AuditLogsList}
                        element={
                            <AdminLayout title={"Audit Logs - Logs"}>
                                <AdminConfig.Breadcrumb name={"auditLogs"} label={"Audit Logs"} />
                                <AuditLogsListWithConfig>
                                    <LogsView />
                                </AuditLogsListWithConfig>
                            </AdminLayout>
                        }
                    />
                </HasPermission>
            </AdminConfig>
        </>
    );
};
