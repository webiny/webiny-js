// @flow
import React, { useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Drawer, DrawerContent, DrawerHeader } from "@webiny/ui/Drawer";
import { List, ListItem, ListItemGraphic, ListItemMeta } from "@webiny/ui/List";
import { IconButton } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import _ from "lodash";
import { getPlugin, getPlugins } from "@webiny/plugins";
import { Typography } from "@webiny/ui/Typography";
import { Transition } from "react-transition-group";
import Menu from "./Menu";
import handlers from "./handlers";
import { useUi } from "@webiny/app/hooks/useUi";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import utils from "./utils";
import {
    linkStyle,
    logoStyle,
    MenuFooter,
    MenuHeader,
    menuSubtitle,
    menuTitle,
    navContent,
    navHeader,
    subFooter,
    submenuItems,
    submenuList
} from "./Styled";

import { ReactComponent as MenuIcon } from "@webiny/app-admin/assets/icons/baseline-menu-24px.svg";
import { ReactComponent as DownIcon } from "@webiny/app-admin/assets/icons/round-keyboard_arrow_down-24px.svg";
import { ReactComponent as UpIcon } from "@webiny/app-admin/assets/icons/round-keyboard_arrow_up-24px.svg";
import { ReactComponent as DocsIcon } from "@webiny/app-admin/assets/icons/icon-documentation.svg";
import { ReactComponent as CommunityIcon } from "@webiny/app-admin/assets/icons/icon-community.svg";
import { ReactComponent as GithubIcon } from "@webiny/app-admin/assets/icons/github-brands.svg";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-admin/navigation");

const Navigation = () => {
    const ui = useUi();
    const appsMenu = ui.appsMenu || {};
    const { hideMenu, initSections } = useHandlers({ ui }, handlers);

    useEffect(() => initSections({ ui }), []);

    const logo = useMemo(() => {
        const logoPlugin = getPlugin("header-logo");
        if (logoPlugin) {
            return React.cloneElement(logoPlugin.render(), { className: logoStyle });
        }
        return null;
    }, []);

    const menus = useMemo(() => {
        const menus = [];
        const menuPlugins = getPlugins("menu");
        menuPlugins &&
            menuPlugins.forEach(plugin => {
                menus.push(plugin.render({ Menu }));
            });
        console.log('enus', menus)
        return menus;
    }, []);

    return (
        <Drawer modal open={appsMenu.show} onClose={hideMenu}>
            <DrawerHeader className={navHeader}>
                <MenuHeader>
                    <IconButton icon={<MenuIcon />} onClick={hideMenu} />
                    {logo}
                </MenuHeader>
            </DrawerHeader>
            <DrawerContent className={navContent}>{menus}</DrawerContent>
            <MenuFooter>
                <List nonInteractive>
                    <a href="https://docs.webiny.com/" rel="noopener noreferrer" target="_blank">
                        <ListItem ripple={false}>
                            <ListItemGraphic>
                                <Icon icon={<DocsIcon />} />
                            </ListItemGraphic>
                            {t`Documentation`}
                        </ListItem>
                    </a>
                    <a
                        href="https://community.webiny.com/"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <ListItem ripple={false}>
                            <ListItemGraphic>
                                <Icon icon={<CommunityIcon />} />
                            </ListItemGraphic>
                            {t`Community`}
                        </ListItem>
                    </a>
                    <a
                        href="https://github.com/webiny/webiny-js"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <ListItem ripple={false}>
                            <ListItemGraphic>
                                <Icon icon={<GithubIcon />} />
                            </ListItemGraphic>
                            {t`Source`}
                        </ListItem>
                    </a>
                    <ListItem ripple={false} className={subFooter}>
                        <div>
                            <a
                                href="https://www.webiny.com/"
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                {t`Webiny.com`}
                            </a>
                            <p>
                                {t`© {year} Webiny Ltd, London, UK`({
                                    year: new Date().getFullYear()
                                })}
                            </p>
                        </div>
                    </ListItem>
                </List>
            </MenuFooter>
        </Drawer>
    );
};

export default Navigation;
