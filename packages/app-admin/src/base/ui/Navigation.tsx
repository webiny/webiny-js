import React, {
    Fragment,
    useEffect,
    createContext,
    useCallback,
    useMemo,
    useState,
    useContext
} from "react";
import { nanoid } from "nanoid";
import { makeComposable, Extensions } from "@webiny/app-admin-core";
import { MenuData, MenuProps, AddMenu as Menu, Tags } from "~/index";
import { plugins } from "@webiny/plugins";
import { AdminMenuPlugin } from "~/types";

export interface NavigationContext {
    menuItems: MenuData[];
    setMenu(id: string, props: MenuProps): void;
    removeMenu(id: string): void;
}

const NavigationContext = createContext<NavigationContext>(null);
NavigationContext.displayName = "NavigationContext";

export function useNavigation() {
    return useContext(NavigationContext);
}

// IMPORTANT! The following component is for BACKWARDS COMPATIBILITY purposes only!
// It is not a public component, and is not even exported from this file. We need it to take care of
// scaffolded plugins in users' projects, as well as our own applications (Page Builder and Form Builder).
const LegacyMenu = props => {
    return (
        <Menu id={props.name || nanoid()} label={props.label} {...props}>
            {props.children}
        </Menu>
    );
};

const LegacyMenuPlugins = () => {
    // IMPORTANT! The following piece of code is for BACKWARDS COMPATIBILITY purposes only!
    const [menus, setMenus] = useState(null);

    useEffect(() => {
        const menuPlugins = plugins.byType<AdminMenuPlugin>("admin-menu");
        if (!menuPlugins) {
            return;
        }

        const menuElements = menuPlugins.map(plugin => {
            return (
                <Extensions key={plugin.name}>
                    {plugin.render({ Menu: LegacyMenu, Item: LegacyMenu, Section: LegacyMenu })}
                </Extensions>
            );
        });

        setMenus(menuElements);
    }, []);

    return menus;
};

export const NavigationProvider = (Component: React.ComponentType<unknown>) => {
    return function NavigationProvider({ children }) {
        const [menuItems, setState] = useState([]);

        const mergeMenuItems = (item1: MenuData, item2: MenuData) => {
            return {
                ...item1,
                label: item2.label ?? item1.label,
                icon: item2.icon ?? item1.icon,
                children: item2.children.reduce(
                    (acc, menu) => {
                        const index = acc.findIndex(i => i.id === menu.id);
                        if (index > -1) {
                            acc[index] = mergeMenuItems(acc[index], menu);
                        } else {
                            acc.push(menu);
                        }
                        return acc;
                    },
                    [...item1.children]
                )
            };
        };

        const setMenu = (id, menuItem) => {
            setState(state => {
                const index = state.findIndex(m => m.id === id);

                return index > -1
                    ? [
                          ...state.slice(0, index),
                          mergeMenuItems(state[index], menuItem),
                          ...state.slice(index + 1)
                      ]
                    : [...state, menuItem];
            });
        };
        const removeMenu = useCallback(
            id => {
                setState(state => {
                    const index = state.findIndex(m => m.id === id);

                    if (index < 0) {
                        return state;
                    }

                    return [...state.slice(0, index), ...state.slice(index + 1)];
                });
            },
            [setState]
        );

        const context = useMemo<NavigationContext>(
            () => ({
                menuItems,
                setMenu,
                removeMenu
            }),
            [menuItems, setMenu, removeMenu]
        );

        return (
            <NavigationContext.Provider value={context}>
                <LegacyMenuPlugins />
                <Component>{children}</Component>
            </NavigationContext.Provider>
        );
    };
};

export const Navigation = () => {
    return (
        <Tags tags={{ location: "navigation" }}>
            <NavigationRenderer />
        </Tags>
    );
};

export const NavigationRenderer = makeComposable("NavigationRenderer");

interface MenuItemContext {
    menuItem: MenuData;
    depth: number;
}

const MenuItemContext = React.createContext<MenuItemContext>(null);
MenuItemContext.displayName = "MenuItemContext";

export function useMenuItem() {
    return React.useContext(MenuItemContext);
}

export interface MenuItemsProps {
    menuItems: MenuData[];
}

export const MenuItems = makeComposable<MenuItemsProps>("MenuItems", ({ menuItems }) => {
    const menuItem = useMenuItem();

    const depth = menuItem ? menuItem.depth : -1;

    return (
        <Fragment>
            {menuItems.map(menuItem => (
                <MenuItemContext.Provider key={menuItem.id} value={{ menuItem, depth: depth + 1 }}>
                    <MenuItem />
                </MenuItemContext.Provider>
            ))}
        </Fragment>
    );
});

export const MenuItem = () => {
    return <MenuItemRenderer />;
};

export const MenuItemRenderer = makeComposable("MenuItemRenderer");
