import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { RegisterFeature } from "@webiny/app-admin";
import { Layout } from "./Layout.js";
import { Navigation } from "./Navigation/Navigation.js";
import { UserMenu } from "~/UserMenu.js";
import { Dialog } from "./Dialog.js";
import { NotFound } from "./NotFound.js";
import { Dashboard } from "./Dashboard.js";
import { Logo } from "./Logo.js";
import { AssistanceWidget } from "./Dashboard/components/index.js";
import { CommunityWidget } from "./Dashboard/components/index.js";
import { DashboardLayoutPresenterFeature } from "./Dashboard/dashboardLayout/presenter/feature.js";

export const AdminUI = () => {
    return (
        <>
            <RegisterFeature feature={DashboardLayoutPresenterFeature} />
            <AdminConfig>
                <AdminConfig.Dashboard.Widget
                    name="admin.assistance"
                    title="Need some assistance?"
                    description="Documentation and ways to reach the Webiny team."
                    group="General"
                    column="right"
                    pin="last"
                    element={<AssistanceWidget />}
                    preview={<AssistanceWidget />}
                />
                <AdminConfig.Dashboard.Widget
                    name="admin.community"
                    title="Join our community"
                    description="GitHub, Slack, YouTube and X."
                    group="General"
                    pin="last"
                    column="right"
                    element={<CommunityWidget />}
                    preview={<CommunityWidget />}
                />
            </AdminConfig>
            <Dashboard />
            <Dialog />
            <Layout />
            <Navigation />
            <NotFound />
            <UserMenu />
            <Logo />
        </>
    );
};
