import React, { Fragment, useCallback, useContext, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { Drawer, DrawerContent, DrawerHeader } from "@webiny/ui/Drawer";
import {
    Compose,
    Provider,
    NavigationRenderer as NavigationSpec,
    MenuItems,
    MenuItemRenderer,
    Brand as BrandSpec,
    useNavigation as useAdminNavigation,
    MenuData,
    MenuItemsProps,
    HigherOrderComponent
} from "@webiny/app-admin";
import Hamburger from "./Hamburger";
import { MenuGroupRenderer } from "./renderers/MenuGroupRenderer";
import { MenuSectionItemRenderer } from "./renderers/MenuSectionItemRenderer";
import { MenuSectionRenderer } from "./renderers/MenuSectionRenderer";
import { MenuLinkRenderer } from "./renderers/MenuLinkRenderer";
import { MenuElementRenderer } from "./renderers/MenuElementRenderer";
import { List, ListItem } from "@webiny/ui/List";
import { MenuFooter, subFooter, MenuHeader, navHeader, navContent } from "./Styled";
import { config as appConfig } from "@webiny/app/config";
import { Typography } from "@webiny/ui/Typography";

const AutoWidthDrawer = styled(Drawer)`
    width: auto;
`;

interface NavigationContext {
    visible: boolean;
    setVisible(visible: boolean): void;
}

const NavigationContext = React.createContext<NavigationContext>({
    visible: false,
    setVisible: () => {
        return void 0;
    }
});
NavigationContext.displayName = "NavigationContext";

export function useNavigation(): NavigationContext {
    return useContext(NavigationContext);
}

const BrandImpl: HigherOrderComponent = Brand => {
    return function BrandWithHamburger() {
        return (
            <Fragment>
                <Hamburger />
                <Brand />
            </Fragment>
        );
    };
};

interface NavigationProviderProps {
    children?: React.ReactNode;
}

const NavigationProvider = (Component: React.FC) => {
    return function NavigationProvider(props: NavigationProviderProps) {
        const [visible, setVisible] = useState(false);

        const context = useMemo(() => ({ visible, setVisible }), [visible]);

        return (
            <NavigationContext.Provider value={context}>
                <Component {...props} />
            </NavigationContext.Provider>
        );
    };
};

export const NavigationImpl = () => {
    return function Navigation() {
        const { menuItems } = useAdminNavigation();
        const { visible, setVisible } = useNavigation();

        const hideDrawer = useCallback(() => {
            setVisible(false);
        }, []);

        const mainMenu = useMemo(
            () => menuItems.filter(m => !(m.tags || []).includes("footer")),
            [menuItems]
        );

        const footerMenu = useMemo(
            () => menuItems.filter(m => (m.tags || []).includes("footer")),
            [menuItems]
        );

        const wbyVersion = appConfig.getKey("WEBINY_VERSION", process.env.REACT_APP_WEBINY_VERSION);

        return (
            <AutoWidthDrawer modal open={visible} onClose={hideDrawer}>
                <DrawerHeader className={navHeader}>
                    <MenuHeader>
                        <BrandSpec />
                    </MenuHeader>
                </DrawerHeader>
                <DrawerContent className={navContent}>
                    <MenuItems menuItems={mainMenu} />
                </DrawerContent>
                <MenuFooter>
                    <List nonInteractive>
                        <MenuItems menuItems={footerMenu} />
                        <ListItem ripple={false} className={subFooter}>
                            <Typography use={"body2"}>Webiny v{wbyVersion}</Typography>
                        </ListItem>
                    </List>
                </MenuFooter>
            </AutoWidthDrawer>
        );
    };
};

const menuSorter = (a: MenuData, b: MenuData): number => {
    if (a.pin === b.pin) {
        return (a.label || "").localeCompare(b.label || "");
    }

    if (a.pin) {
        return a.pin === "first" ? -1 : 1;
    }

    if (b.pin) {
        return b.pin === "first" ? 1 : -1;
    }

    return (a.label || "").localeCompare(b.label || "");
};

const SortedMenuItems: HigherOrderComponent<MenuItemsProps> = MenuItems => {
    return function SortedMenuItems({ menuItems }) {
        return <MenuItems menuItems={[...menuItems].sort(menuSorter)} />;
    };
};

export const Navigation = () => {
    return (
        <Fragment>
            <Provider hoc={NavigationProvider} />
            <Compose component={NavigationSpec} with={NavigationImpl} />
            <Compose component={MenuItems} with={SortedMenuItems} />
            <Compose component={BrandSpec} with={BrandImpl} />
            <Compose
                component={MenuItemRenderer}
                with={[
                    MenuGroupRenderer,
                    MenuSectionItemRenderer,
                    MenuSectionRenderer,
                    MenuLinkRenderer,
                    MenuElementRenderer
                ]}
            />
        </Fragment>
    );
};
