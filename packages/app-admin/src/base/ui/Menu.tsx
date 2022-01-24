import React, { createContext, useState, useContext, useEffect } from "react";
import { set } from "dot-prop-immutable";
import { useNavigation } from "~/index";

export interface MenuContext {
    menuItem: MenuData;
    setMenu(id: string, props: MenuData): void;
}

const MenuContext = createContext(null);
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

/**
 * Register a new menu item into the Admin app.
 *
 * @param children
 * @param props
 * @constructor
 */
export const AddMenu = ({ children, ...props }: MenuProps) => {
    const [state, setState] = useState({ ...props, children: [] });
    const menu = useMenu();
    const navigation = useNavigation();

    useEffect(() => {
        if (menu) {
            menu.setMenu(state.name, state);
        } else {
            navigation.setMenu(state.name, state);
        }
    }, [state]);

    useEffect(() => {
        return () => navigation.removeMenu(state.name);
    }, []);

    const context = {
        setMenu(name: string, props: MenuData) {
            setState(menu => {
                const childIndex = menu.children.findIndex(ch => ch.name === name);
                if (childIndex === -1) {
                    return {
                        ...menu,
                        children: [...menu.children, { ...props }]
                    };
                }
                return {
                    ...menu,
                    children: set(menu.children, childIndex, (curr: Record<string, any>) => ({
                        ...curr,
                        ...props
                    }))
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
