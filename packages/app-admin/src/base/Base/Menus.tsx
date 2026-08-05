import React from "react";
import { ReactComponent as DashboardIcon } from "@webiny/icons/space_dashboard.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { AdminConfig } from "~/config/AdminConfig.js";
import { Menu } from "~/config/AdminConfig/Menu.js";

export const Menus = React.memo(() => {
    // TODO: WCP upgrade link temporarily removed during feature flags migration.
    // const wcp = useWcp();
    // const hasWcpLicense = Boolean(wcp.getProject());

    return (
        <AdminConfig>
            <Menu
                name={"home"}
                pin={"start"}
                element={
                    <Menu.Link
                        to={"/"}
                        text={"Home"}
                        icon={<Menu.Link.Icon label="Home" element={<DashboardIcon />} />}
                    />
                }
            />
            <Menu
                name={"settings"}
                hideIfEmpty={true}
                pin={"end"}
                element={
                    <Menu.Item
                        text={"Settings"}
                        icon={<Menu.Link.Icon label="Settings" element={<SettingsIcon />} />}
                    />
                }
            />

            <Menu
                parent={"settings"}
                name="settings.system"
                element={<Menu.Group text="System" collapsible={false} />}
            />
        </AdminConfig>
    );
});

Menus.displayName = "Menus";
