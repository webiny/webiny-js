import React, { useCallback } from "react";
import { AdminConfig, useAuthentication } from "@webiny/app-admin";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as LogoutIcon } from "@webiny/icons/logout.svg";

/**
 * Baseline command-palette actions available everywhere in the admin app. Modules
 * register their own actions via `AdminConfig.CommandPalette.Command`; richer actions
 * (new entry, publish, upload, invite user, …) are a follow-up owned by each module.
 */
export const GlobalCommands = () => {
    const { logout } = useAuthentication();

    const copyCurrentUrl = useCallback(() => {
        void navigator.clipboard?.writeText(window.location.href);
    }, []);

    return (
        <AdminConfig>
            <AdminConfig.CommandPalette.Command
                name="admin.copyCurrentUrl"
                label="Copy current URL"
                description="Copy this page's link to the clipboard"
                keywords="clipboard share link"
                icon={<Icon icon={<CopyIcon />} size="sm" color="neutral-strong" label="" />}
                onSelect={copyCurrentUrl}
            />
            <AdminConfig.CommandPalette.Command
                name="admin.signOut"
                label="Sign out"
                description="Log out of the admin app"
                keywords="logout exit session"
                icon={<Icon icon={<LogoutIcon />} size="sm" color="neutral-strong" label="" />}
                onSelect={logout}
            />
        </AdminConfig>
    );
};
