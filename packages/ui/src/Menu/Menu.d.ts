import * as React from "react";
import { MenuItemProps as BaseMenuItemProps } from "@rmwc/menu";
declare type Props = {
    children: React.ReactNode;
    handle?: React.ReactElement;
    onSelect?: (evt: any) => any;
    anchor?: "bottomEnd" | "bottomLeft" | "bottomRight" | "bottomStart" | "topEnd" | "topLeft" | "topRight" | "topStart";
    className?: string;
};
declare type State = {
    menuIsOpen: boolean;
};
/**
 * Use Menu component to display a list of choices, once the handler is triggered.
 */
declare class Menu extends React.Component<Props, State> {
    static defaultProps: {
        handle: any;
        anchor: string;
    };
    state: {
        menuIsOpen: boolean;
    };
    anchorRef: React.RefObject<unknown>;
    menuRef: React.RefObject<unknown>;
    componentDidUpdate(): void;
    openMenu: () => void;
    closeMenu: () => void;
    renderMenuWithPortal: () => any;
    renderCustomContent: () => JSX.Element;
    renderMenuContent: () => any;
    render(): JSX.Element;
}
declare const MenuDivider: () => JSX.Element;
interface MenuItemProps extends BaseMenuItemProps {
    children: React.ReactNode;
    className?: string;
    onClick?: (event: React.MouseEvent) => void;
}
declare const MenuItem: ({ disabled, className, ...rest }: MenuItemProps) => JSX.Element;
export { Menu, MenuItem, MenuDivider };
