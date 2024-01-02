import React, { Fragment, useCallback, useEffect, useState } from "react";
import { makeComposable } from "@webiny/app";
import { ComponentWithChildren } from "~/types";

export interface UserMenuItemData {
    label?: string;
    icon?: JSX.Element;
    path?: string;
    onClick?: () => void;
    element?: JSX.Element;
}

export interface UserMenuContext {
    menuItems: UserMenuItemData[];
    addMenuItem(item: UserMenuItemData): void;
}

const UserMenuContext = React.createContext<UserMenuContext>({
    addMenuItem: () => {
        return void 0;
    },
    menuItems: []
});
UserMenuContext.displayName = "UserMenuContext";

export function useUserMenu() {
    return React.useContext(UserMenuContext);
}

interface UserMenuProviderProps {
    children: React.ReactNode;
    [key: string]: any;
}

export const UserMenuProvider = (Component: ComponentWithChildren) => {
    return function UserMenuProvider({ children, ...props }: UserMenuProviderProps) {
        const [menuItems, setItems] = useState<UserMenuItemData[]>([]);

        const addMenuItem = useCallback<UserMenuContext["addMenuItem"]>(
            item => {
                setItems(items => [...items, item]);

                return () => {
                    setItems(items => {
                        const index = items.findIndex(i => i === item);
                        if (index < 0) {
                            return items;
                        }

                        return [...items.slice(0, index), ...items.slice(index + 1)];
                    });
                };
            },
            [setItems]
        );

        const context = {
            menuItems,
            addMenuItem
        };

        return (
            <UserMenuContext.Provider value={context}>
                <Component {...props}>{children}</Component>
            </UserMenuContext.Provider>
        );
    };
};

export const UserMenu = makeComposable("UserMenu", () => {
    return <UserMenuRenderer />;
});

export const UserMenuRenderer = makeComposable("UserMenuRenderer");

export const UserMenuHandle = makeComposable("UserMenuHandle", () => {
    return <UserMenuHandleRenderer />;
});

export const UserMenuHandleRenderer = makeComposable("UserMenuHandleRenderer");

export interface UserMenuItemProps {
    menuItem: UserMenuItemData;
}

export const UserMenuItem = makeComposable<UserMenuItemProps>("UserMenuItem", ({ menuItem }) => {
    return (
        <UserMenuItemContext.Provider value={menuItem}>
            <UserMenuItemRenderer />
        </UserMenuItemContext.Provider>
    );
});

export const UserMenuItemRenderer = makeComposable("UserMenuItemRenderer");

export const AddUserMenuItem = (props: UserMenuItemProps["menuItem"]) => {
    const { addMenuItem } = useUserMenu();

    useEffect(() => {
        return addMenuItem(props);
    }, []);

    return null;
};

export type UserMenuItemContext = UserMenuItemData;

const UserMenuItemContext = React.createContext<UserMenuItemContext>({
    element: undefined,
    icon: undefined,
    label: undefined,
    onClick: () => {
        return void 0;
    },
    path: undefined
});
UserMenuItemContext.displayName = "UserMenuItemContext";

export function useUserMenuItem() {
    return React.useContext(UserMenuItemContext);
}

export interface UserMenuItemsProps {
    menuItems: UserMenuItemData[];
}

export const UserMenuItems = makeComposable<UserMenuItemsProps>(
    "UserMenuItems",
    ({ menuItems }) => {
        return (
            <Fragment>
                {menuItems.map((item, index) => (
                    <UserMenuItem key={index} menuItem={item} />
                ))}
            </Fragment>
        );
    }
);
