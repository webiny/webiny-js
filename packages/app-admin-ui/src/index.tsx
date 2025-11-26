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

const { Widget } = AdminConfig;

export const AdminUI = () => {
    return (
        <>
            <AdminConfig.Public>
                <Widget
                    name="admin.assistance"
                    column={2}
                    order={100}
                    element={<AssistanceWidget />}
                />
                <Widget
                    name="admin.community"
                    column={2}
                    order={110}
                    element={<CommunityWidget />}
                />
            </AdminConfig.Public>
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
