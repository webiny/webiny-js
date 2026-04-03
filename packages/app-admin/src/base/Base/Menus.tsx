import React from "react";
import { ReactComponent as DashboardIcon } from "@webiny/icons/space_dashboard.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { ReactComponent as FileManagerIcon } from "@webiny/icons/folder_open.svg";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";
import { ReactComponent as SlackIcon } from "@webiny/icons/numbers.svg";
import { ReactComponent as DocsIcon } from "@webiny/icons/summarize.svg";
import { ReactComponent as GithubIcon } from "@webiny/icons/route.svg";
import { ReactComponent as MoreIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as UpgradeIcon } from "@webiny/icons/electric_bolt.svg";
import { DropdownMenu } from "@webiny/admin-ui";
import { SupportMenuItems } from "./Menus/SupportMenuItems.js";
import { AdminConfig } from "~/config/AdminConfig.js";
import { HasPermission } from "~/presentation/security/components/HasPermission.js";
import { Menu } from "~/config/AdminConfig/Menu.js";
import { useWcp } from "~/index.js";

export const Menus = React.memo(() => {
    const wcp = useWcp();
    const hasWcpLicense = Boolean(wcp.getProject());

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
            <HasPermission name={"fm.file"}>
                <Menu
                    name={"fileManager"}
                    pin={"start"}
                    element={
                        <Menu.Link
                            text={"File Manager"}
                            icon={
                                <Menu.Item.Icon
                                    label="File Manager"
                                    element={<FileManagerIcon />}
                                />
                            }
                            to={"/file-manager"}
                        />
                    }
                />
            </HasPermission>
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
                name="settings.apps"
                element={<Menu.Group text="Apps" collapsible={false} />}
            />

            <Menu.Support
                name={"docs"}
                element={
                    <Menu.Support.Link
                        text={"Documentation"}
                        icon={<Menu.Support.Link.Icon label="Docs" element={<DocsIcon />} />}
                        to={"https://www.webiny.com/docs"}
                        rel={"noopener noreferrer"}
                        target={"_blank"}
                    />
                }
            />

            <Menu.Support
                name={"github"}
                element={
                    <Menu.Support.Link
                        text={"GitHub"}
                        icon={<Menu.Support.Link.Icon label="GitHub" element={<GithubIcon />} />}
                        to={"https://github.com/webiny/webiny-js"}
                        rel={"noopener noreferrer"}
                        target={"_blank"}
                    />
                }
            />

            <Menu.Support
                name={"slack"}
                element={
                    <Menu.Support.Link
                        text={"Slack"}
                        icon={<Menu.Support.Link.Icon label="Slack" element={<SlackIcon />} />}
                        to={"https://www.webiny.com/slack"}
                        rel={"noopener noreferrer"}
                        target={"_blank"}
                    />
                }
            />

            {!hasWcpLicense && (
                <Menu.Support
                    name={"upgrade-webiny"}
                    pin={"end"}
                    element={
                        <>
                            <DropdownMenu.Separator />
                            <Menu.Support.Link
                                text={"Upgrade"}
                                icon={
                                    <Menu.Support.Link.Icon
                                        label="Upgrade"
                                        element={<UpgradeIcon />}
                                    />
                                }
                                to={"https://www.webiny.com/pricing"}
                                rel={"noopener noreferrer"}
                                target={"_blank"}
                                className={
                                    "[&_a]:text-accent-primary! [&_svg]:fill-accent-default! font-semibold"
                                }
                            />
                        </>
                    }
                />
            )}

            <Menu.Footer
                name={"support"}
                element={
                    <DropdownMenu
                        className={"w-[225px]"}
                        trigger={
                            <Menu.Item
                                text={"Support"}
                                icon={<Menu.Item.Icon label="Support" element={<InfoIcon />} />}
                                action={<Menu.Item.Action element={<MoreIcon />} />}
                            />
                        }
                    >
                        <SupportMenuItems />
                    </DropdownMenu>
                }
            />
        </AdminConfig>
    );
});

Menus.displayName = "Menus";
