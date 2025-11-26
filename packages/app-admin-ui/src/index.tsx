import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { Layout } from "./Layout.js";
import { Navigation } from "./Navigation.js";
import { UserMenu } from "~/UserMenu.js";
import { Dialog } from "./Dialog.js";
import { NotFound } from "./NotFound.js";
import { Dashboard } from "./Dashboard.js";
import { Logo } from "./Logo.js";
import { AssistanceWidget, CommunityWidget } from "./Dashboard/components/index.js";

export const AdminUI = () => {
    return (
        <>
            <AdminConfig>
                <AdminConfig.Dashboard.Widget
                    name="admin.assistance"
                    column="right"
                    pin="last"
                    element={<AssistanceWidget />}
                />
                <AdminConfig.Dashboard.Widget
                    name="admin.community"
                    pin="last"
                    column="right"
                    element={<CommunityWidget />}
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
