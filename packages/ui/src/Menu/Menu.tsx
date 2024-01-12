import React from "react";
import {
    Menu as BaseMenu,
    MenuProps as RmwcMenuProps,
    MenuItem as BaseMenuItem,
    MenuItemProps as BaseMenuItemProps,
    MenuSurface,
    MenuSurfaceAnchor
} from "@rmwc/menu";
import { css } from "emotion";
import classNames from "classnames";

const style = {
    disabledMenuItem: css({
        opacity: 0.5,
        pointerEvents: "none"
    })
};

export type MenuChildrenFunctionProps = {
    closeMenu: () => void;
};

export interface RenderableMenuChildren {
    (props: MenuChildrenFunctionProps): React.ReactElement;
}
export type MenuProps = RmwcMenuProps & {
    // One or more MenuItem components.
    children: React.ReactNode | RenderableMenuChildren;

    // Custom render function for MenuItem content, prioritized over 'children'.
    render?: (props: MenuChildrenFunctionProps) => React.ReactNode;

    // A handler which triggers the menu, eg. button or link.
    handle?: React.ReactElement;

    // Position the menu to one of anchor corners.
    // 'bottomEnd' | 'bottomLeft' | 'bottomRight' | 'bottomStart' | 'topEnd' | 'topLeft' | 'topRight' | 'topStart'
    anchor?:
        | "bottomEnd"
        | "bottomLeft"
        | "bottomRight"
        | "bottomStart"
        | "topEnd"
        | "topLeft"
        | "topRight"
        | "topStart";

    // Class that will be added to the Menu element.
    className?: string;

    // If true, prevents menu from opening when clicked.
    disabled?: boolean;

    onOpen?: () => void;
    onClose?: () => void;

    // For testing purposes.
    "data-testid"?: string;
};

interface MenuState {
    menuIsOpen: boolean;
}

/**
 * Use Menu component to display a list of choices, once the handler is triggered.
 */
class Menu extends React.Component<MenuProps, MenuState> {
    static defaultProps: Partial<MenuProps> = {
        anchor: "topStart"
    };

    public override state: MenuState = {
        menuIsOpen: false
    };

    private readonly openMenu = () => {
        if (this.props.disabled !== true) {
            this.setState({ menuIsOpen: true }, () => this.props.onOpen && this.props.onOpen());
        }
    };

    private readonly closeMenu = () => {
        this.setState({ menuIsOpen: false }, () => this.props.onClose && this.props.onClose());
    };

    private readonly renderMenuWithPortal = () => {
        return (
            <BaseMenu
                anchorCorner={this.props.anchor}
                open={this.state.menuIsOpen}
                className={this.props.className}
                onClose={this.closeMenu}
                onSelect={this.props.onSelect}
                renderToPortal={true}
                style={{ zIndex: 101 }} // Fixes Menu in Drawers
            >
                {this.props.children}
            </BaseMenu>
        );
    };

    private readonly renderCustomContent = () => {
        const { children, render } = this.props;
        return (
            <MenuSurface
                open={this.state.menuIsOpen}
                onClose={this.closeMenu}
                renderToPortal={this.props.renderToPortal}
            >
                {typeof render === "function" ? render({ closeMenu: this.closeMenu }) : children}
            </MenuSurface>
        );
    };

    private readonly renderMenuContent = () => {
        return Array.isArray(this.props.children)
            ? this.renderMenuWithPortal()
            : this.renderCustomContent();
    };

    public override render(): React.ReactNode {
        return (
            <MenuSurfaceAnchor data-testid={this.props["data-testid"]}>
                {this.renderMenuContent()}
                {this.props.handle &&
                    React.cloneElement(this.props.handle, { onClick: this.openMenu })}
            </MenuSurfaceAnchor>
        );
    }
}

const MenuDivider = () => {
    return <li className="mdc-list-divider" role="separator" />;
};

interface MenuItemProps extends BaseMenuItemProps {
    children: React.ReactNode;
    className?: string;
    onClick?: (event: React.MouseEvent) => void;
    "data-testid"?: string;
}

const MenuItem = ({ disabled, className, ...rest }: MenuItemProps) => {
    return (
        <BaseMenuItem
            {...rest}
            className={classNames(className, { [style.disabledMenuItem]: disabled })}
        />
    );
};

export { Menu, MenuItem, MenuDivider };
