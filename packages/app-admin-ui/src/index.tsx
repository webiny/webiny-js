import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { Layout } from "./Layout.js";
import { Navigation } from "./Navigation/Navigation.js";
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
                <AdminConfig.CommandPalette.Command
                    name="admin.copyCurrentUrl"
                    label="Copy current URL"
                    description="Copy this page's link to the clipboard"
                    keywords="clipboard share link"
                    icon={<Icon icon={<CopyIcon />} size="sm" color="neutral-strong" label="" />}
                    onSelect={() => {
                        void navigator.clipboard?.writeText(window.location.href);
                    }}
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
