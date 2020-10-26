import React, { useMemo, useState, useEffect } from "react";
import { sortBy } from "lodash";
import { Drawer, DrawerContent, DrawerHeader } from "@webiny/ui/Drawer";
import { List, ListItem, ListItemGraphic } from "@webiny/ui/List";
import { IconButton } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { css } from "emotion";
import { getPlugin, getPlugins } from "@webiny/plugins";
import { AdminMenuLogoPlugin, AdminMenuPlugin } from "@webiny/app-admin/types";
import { useNavigation, Menu, Item, Section } from "./components";
import { logoStyle, MenuFooter, MenuHeader, navContent, navHeader, subFooter } from "./Styled";
import { ReactComponent as MenuIcon } from "@webiny/app-admin/assets/icons/baseline-menu-24px.svg";
import { ReactComponent as DocsIcon } from "@webiny/app-admin/assets/icons/icon-documentation.svg";
import { ReactComponent as CommunityIcon } from "@webiny/app-admin/assets/icons/icon-community.svg";
import { ReactComponent as GithubIcon } from "@webiny/app-admin/assets/icons/github-brands.svg";
import { ReactComponent as InfoIcon } from "@webiny/app-admin/assets/icons/info.svg";
import ApiInformationDialog from "@webiny/app-admin/components/ApiInformationDialog";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-admin/navigation");

const style = {
    environmentContainer: css({
        color: "var(--mdc-theme-text-secondary-on-background)"
    }),
    infoContainer: css({
        alignSelf: "center"
    })
};

const Navigation = () => {
    const { hideMenu, menuIsShown, initSections } = useNavigation();
    const [infoOpened, setInfoOpened] = useState(false);

    useEffect(initSections, []);
    const logo = useMemo(() => {
        const logoPlugin = getPlugin<AdminMenuLogoPlugin>("admin-menu-logo");
        if (logoPlugin) {
            return React.cloneElement(logoPlugin.render(), { className: logoStyle });
        }
        return null;
    }, []);

    const menus = [];
    const menuPlugins = getPlugins<AdminMenuPlugin>("admin-menu");

    // First we sort by order (default: 50), and then by plugin name. In other words, if order isn't defined,
    // then we just sort by plugin name.
    menuPlugins &&
        sortBy(menuPlugins, [p => p.order || 50, p => p.name]).forEach(plugin => {
            menus.push(
                <React.Fragment key={plugin.name}>
                    {plugin.render({ Menu, Section, Item })}
                </React.Fragment>
            );
        });

    return (
        <Drawer modal open={menuIsShown()} onClose={hideMenu}>
            <DrawerHeader className={navHeader}>
                <MenuHeader>
                    <IconButton icon={<MenuIcon />} onClick={hideMenu} />
                    {logo}
                </MenuHeader>
            </DrawerHeader>
            <DrawerContent className={navContent}>{menus}</DrawerContent>
            <MenuFooter>
                <List nonInteractive>
                    <div
                        className={style.infoContainer}
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setInfoOpened(true);
                        }}
                    >
                        <ListItem ripple={false}>
                            <ListItemGraphic>
                                <Icon icon={<InfoIcon />} />
                            </ListItemGraphic>
                            {t`API information`}
                        </ListItem>
                    </div>
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

                <ApiInformationDialog open={infoOpened} onClose={() => setInfoOpened(false)} />
            </MenuFooter>
        </Drawer>
    );
};

export default Navigation;
