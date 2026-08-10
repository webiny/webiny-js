import React from "react";
import { ReactComponent as DashboardIcon } from "@webiny/icons/space_dashboard.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { ReactComponent as UpgradeIcon } from "@webiny/icons/electric_bolt.svg";
import { AdminConfig } from "~/config/AdminConfig.js";
import { Menu } from "~/config/AdminConfig/Menu.js";
import { useFeatureFlags } from "~/presentation/featureFlags/useFeatureFlags.js";

export const Menus = React.memo(() => {
    const featureFlags = useFeatureFlags();
    const showUpgrade = !featureFlags.isEnabled("multiTenancy");

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

            {showUpgrade && (
                <Menu.Footer
                    name={"upgrade"}
                    element={
                        <Menu.Link
                            text={"Upgrade"}
                            icon={<Menu.Link.Icon label="Upgrade" element={<UpgradeIcon />} />}
                            to={"https://www.webiny.com/pricing"}
                            rel={"noopener noreferrer"}
                            target={"_blank"}
                            className={
                                "[&_a]:text-accent-primary! [&_svg]:fill-accent-default! font-semibold"
                            }
                        />
                    }
                />
            )}
        </AdminConfig>
    );
});

Menus.displayName = "Menus";
