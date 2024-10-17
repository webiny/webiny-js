import React, { Fragment, useCallback, useEffect, useState } from "react";
import { createProvider, createVoidComponent, makeDecoratable } from "@webiny/app";

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

export const UserMenuProvider = createProvider(Component => {
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
});

export const UserMenu = makeDecoratable("UserMenu", () => {
    return <UserMenuRenderer />;
});

export const UserMenuRenderer = makeDecoratable("UserMenuRenderer", createVoidComponent());

export const UserMenuHandle = makeDecoratable("UserMenuHandle", () => {
    return <UserMenuHandleRenderer />;
});

export const UserMenuHandleRenderer = makeDecoratable(
    "UserMenuHandleRenderer",
    createVoidComponent()
);

export interface UserMenuItemProps {
    menuItem: UserMenuItemData;
}

export const UserMenuItem = makeDecoratable("UserMenuItem", ({ menuItem }: UserMenuItemProps) => {
    return (
        <UserMenuItemContext.Provider value={menuItem}>
            <UserMenuItemRenderer />
        </UserMenuItemContext.Provider>
    );
});

export const UserMenuItemRenderer = makeDecoratable("UserMenuItemRenderer", createVoidComponent());

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

export const UserMenuItems = makeDecoratable(
    "UserMenuItems",
    ({ menuItems }: UserMenuItemsProps) => {
        return (
            <Fragment>
                {menuItems.map((item, index) => (
                    <UserMenuItem key={index} menuItem={item} />
                ))}
            </Fragment>
        );
    }
);
