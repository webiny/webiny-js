import React, {
    createContext,
    Fragment,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";
import { generateId } from "@webiny/utils";
import { createProvider, createVoidComponent, makeDecoratable, Plugins } from "@webiny/app";
import { AddMenu as Menu, createEmptyMenu, MenuData, MenuProps, MenuUpdater, Tags } from "~/index";
import { plugins } from "@webiny/plugins";
import { AdminMenuPlugin } from "~/types";
import { ItemProps, SectionProps } from "~/plugins/MenuPlugin";

export interface NavigationContext {
    menuItems: MenuData[];
    setMenu(id: string, update: MenuUpdater): void;
    removeMenu(id: string): void;
}

const NavigationContext = createContext<NavigationContext>({
    menuItems: [],
    setMenu: () => {
        return void 0;
    },
    removeMenu: () => {
        return void 0;
    }
});
NavigationContext.displayName = "NavigationContext";

export function useNavigation() {
    return useContext(NavigationContext);
}

type LegacyMenuProps = MenuProps | SectionProps | ItemProps;

// IMPORTANT! The following component is for BACKWARDS COMPATIBILITY purposes only!
// It is not a public component, and is not even exported from this file. We need it to take care of
// scaffolded plugins in users' projects, as well as our own applications (Page Builder and Form Builder).
const LegacyMenu = (props: LegacyMenuProps & { children: React.ReactNode }) => {
    return (
        <Menu
            {...props}
            name={(props as MenuProps).name || generateId()}
            label={props.label as string}
        >
            {props.children}
        </Menu>
    );
};

const LegacyMenuPlugins = () => {
    // IMPORTANT! The following piece of code is for BACKWARDS COMPATIBILITY purposes only!
    const [menus, setMenus] = useState<JSX.Element | null>(null);

    useEffect(() => {
        const menuPlugins = plugins.byType<AdminMenuPlugin>("admin-menu");
        if (!menuPlugins) {
            return;
        }

        const menuElements = menuPlugins.map(plugin => {
            // TODO @ts-refactor figure out correct types or write a comment to leave as React.FC
            return (
                <Plugins key={plugin.name}>
                    {plugin.render({
                        Menu: LegacyMenu as React.FC,
                        Item: LegacyMenu as React.FC,
                        Section: LegacyMenu as React.FC
                    })}
                </Plugins>
            );
        });
        /**
         * TODO Figure out correct types for the menus.
         */
        // @ts-expect-error
        setMenus(menuElements);
    }, []);

    return menus;
};

interface NavigationProviderProps {
    children: React.ReactNode;
}

export const NavigationProvider = createProvider(Component => {
    return function NavigationProvider({ children }: NavigationProviderProps) {
        const [menuItems, setState] = useState<MenuData[]>([]);

        const setMenu = (id: string, updater: MenuUpdater): void => {
            setState(state => {
                const index = state.findIndex(m => m.name === id);

                const newMenu = index > -1 ? updater(state[index]) : updater(createEmptyMenu(id));
                if (!newMenu) {
                    return [...state];
                }
                if (!newMenu.children) {
                    newMenu.children = [];
                }

                return index > -1
                    ? [...state.slice(0, index), newMenu, ...state.slice(index + 1)]
                    : [...state, newMenu];
            });
        };
        const removeMenu = useCallback(
            (id: string) => {
                setState(state => {
                    const index = state.findIndex(m => m.name === id);

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
});

export const Navigation = makeDecoratable("Navigation", () => {
    return (
        <Tags tags={{ location: "navigation" }}>
            <NavigationRenderer />
        </Tags>
    );
});

export const NavigationRenderer = makeDecoratable("NavigationRenderer", createVoidComponent());

interface MenuItemContext {
    menuItem?: MenuData;
    depth: number;
}

const MenuItemContext = React.createContext<MenuItemContext>({
    menuItem: undefined,
    depth: -1
});
MenuItemContext.displayName = "MenuItemContext";

export function useMenuItem() {
    return React.useContext(MenuItemContext);
}

export interface MenuItemsProps {
    menuItems: MenuData[];
}

export const MenuItems = makeDecoratable("MenuItems", ({ menuItems }: MenuItemsProps) => {
    const menuItem = useMenuItem();

    const depth = menuItem ? menuItem.depth : -1;

    return (
        <Fragment>
            {menuItems.map(menuItem => (
                <MenuItemContext.Provider
                    key={menuItem.name}
                    value={{ menuItem, depth: depth + 1 }}
                >
                    <MenuItem />
                </MenuItemContext.Provider>
            ))}
        </Fragment>
    );
});

export const MenuItem = () => {
    return <MenuItemRenderer />;
};

export const MenuItemRenderer = makeDecoratable("MenuItemRenderer", createVoidComponent());
