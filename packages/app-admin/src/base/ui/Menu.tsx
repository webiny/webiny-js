import React, { createContext, useContext, useEffect } from "react";
import { useNavigation } from "~/index";

export interface MenuUpdater {
    (menuItem: MenuData | undefined | null): MenuData | undefined;
}

export interface MenuContext {
    menuItem: MenuData | null;
    setMenu(id: string, updater: MenuUpdater): void;
    removeMenu(id: string): void;
}

const MenuContext = createContext<MenuContext | undefined>(undefined);
MenuContext.displayName = "MenuContext";

const useMenu = () => {
    return useContext(MenuContext);
};

export interface MenuProps {
    name: string;
    label?: string;
    path?: string;
    icon?: JSX.Element;
    onClick?: () => void;
    testId?: string;
    tags?: string[];
    target?: string;
    rel?: string;
    element?: JSX.Element;
    children?: React.ReactNode | React.ReactNode[];
    pin?: "first" | "last";
}

export interface MenuData extends MenuProps {
    children: MenuData[];
}

export const createEmptyMenu = (name: string): MenuData => {
    return {
        name,
        tags: [],
        children: []
    };
};

const keys: (keyof MenuData)[] = [
    "label",
    "path",
    "icon",
    "onClick",
    "testId",
    "tags",
    "target",
    "rel",
    "element",
    "pin"
];

const mergeMenuItems = (item1: MenuData, item2: MenuData): MenuData => {
    return {
        ...item1,
        ...keys.reduce((map, key) => ({ ...map, [key]: item2[key] ?? item1[key] }), {}),
        children: (item2.children || []).reduce(
            (acc, menu) => {
                const index = acc.findIndex(i => i.name === menu.name);
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

/**
 * Register a new menu item into the Admin app.
 */
export const AddMenu = ({ children, ...props }: MenuProps) => {
    const menu = useMenu();
    const navigation = useNavigation();

    useEffect(() => {
        if (menu) {
            menu.setMenu(props.name, existing => {
                if (!existing) {
                    return { ...props, children: [] } as MenuData;
                }

                return mergeMenuItems(existing, props as MenuData);
            });
        } else {
            navigation.setMenu(props.name, existing => {
                /**
                 * We return props because this will break otherwise.
                 * TODO @pavel check if this is correct
                 */
                if (!existing) {
                    return props as MenuData;
                }
                return mergeMenuItems(existing, props as MenuData);
            });
        }

        return () => {
            if (menu) {
                menu.removeMenu(props.name);
            } else {
                navigation.removeMenu(props.name);
            }
        };
    }, []);

    const context: MenuContext = {
        menuItem: { ...props, children: [] },
        removeMenu(name) {
            (menu || navigation).setMenu(props.name, existing => {
                if (!existing) {
                    return undefined;
                }

                const childIndex = existing.children.findIndex(ch => ch.name === name);
                if (childIndex > -1) {
                    return {
                        ...existing,
                        children: [
                            ...existing.children.slice(0, childIndex),
                            ...existing.children.slice(childIndex + 1)
                        ]
                    };
                }

                return existing;
            });
        },
        setMenu(name: string, updater: MenuUpdater) {
            (menu || navigation).setMenu(props.name, existing => {
                if (!existing) {
                    existing = createEmptyMenu(props.name);
                }

                const subItems = existing.children;

                const childIndex = subItems.findIndex(ch => ch.name === name);
                if (childIndex === -1) {
                    return {
                        ...existing,
                        children: [...subItems, updater(null)].filter(Boolean) as MenuData[]
                    };
                }

                return {
                    ...existing,
                    children: [
                        ...subItems.slice(0, childIndex),
                        updater(subItems[childIndex]),
                        ...subItems.slice(childIndex + 1)
                    ].filter(Boolean) as MenuData[]
                };
            });
        }
    };

    if (!children) {
        return null;
    }

    return <MenuContext.Provider value={context}>{children}</MenuContext.Provider>;
};

AddMenu.defaultProps = { tags: [] };
