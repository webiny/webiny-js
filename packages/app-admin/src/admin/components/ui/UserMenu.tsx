import React, { Fragment, useCallback, useEffect, useState } from "react";
import { makeComposable } from "~/admin/makeComposable";

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

const UserMenuContext = React.createContext<UserMenuContext>(null);
UserMenuContext.displayName = "UserMenuContext";

export function useUserMenu() {
    return React.useContext(UserMenuContext);
}

export const UserMenuProvider = Component => {
    return function UserMenuProvider({ children, ...props }) {
        const [menuItems, setItems] = useState([]);

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

export const UserMenuRenderer = makeComposable("UserMenuRenderer", () => {
    useEffect(() => {
        console.info(
            `<UserMenuRenderer/> is not implemented! To provide an implementation, use the <Compose/> component.`
        );
    }, []);

    return null;
});

export const UserMenuHandle = makeComposable("UserMenuHandle", () => {
    return <UserMenuHandleRenderer />;
});

export const UserMenuHandleRenderer = makeComposable("UserMenuHandleRenderer", () => {
    useEffect(() => {
        console.info(
            `<UserMenuHandleRenderer/> is not implemented! To provide an implementation, use the <Compose/> component.`
        );
    }, []);

    return null;
});

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

export const UserMenuItemRenderer = makeComposable("UserMenuItemRenderer", () => {
    useEffect(() => {
        console.info(
            `<UserMenuRenderer/> is not implemented! To provide an implementation, use the <Compose/> component.`
        );
    }, []);

    return null;
});

export const AddUserMenuItem = (props: UserMenuItemProps["menuItem"]) => {
    const { addMenuItem } = useUserMenu();

    useEffect(() => {
        return addMenuItem(props);
    }, []);

    return null;
};

export type UserMenuItemContext = UserMenuItemData;

const UserMenuItemContext = React.createContext<UserMenuItemContext>(null);
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
