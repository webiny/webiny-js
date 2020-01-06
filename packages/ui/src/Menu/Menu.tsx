import * as React from "react";
import ReactDOM from "react-dom";
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

type MenuProps = RmwcMenuProps & {
    // One or more MenuItem components.
    children: React.ReactNode;

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
};

type State = {
    menuIsOpen: boolean;
};

let el = null;
const getElement = () => {
    if (!el) {
        el = document.createElement("div");
        el.id = "menu-container";
        el.style.position = "fixed";
        el.style.top = "0";
        el.style.zIndex = "10";
        document.body.appendChild(el);
    }

    return el;
};

/**
 * Use Menu component to display a list of choices, once the handler is triggered.
 */
class Menu extends React.Component<MenuProps, State> {
    static defaultProps = {
        handle: null,
        anchor: "topStart"
    };

    state = {
        menuIsOpen: false
    };

    anchorRef = React.createRef();
    menuRef = React.createRef();

    componentDidUpdate() {
        if (!this.menuRef.current || !this.anchorRef.current) {
            return;
        }

        const menu: any = this.menuRef.current;

        // @ts-ignore
        const anchorRect = this.anchorRef.current.getBoundingClientRect();

        menu.style.position = "absolute";
        menu.style.left = anchorRect.left - 60 + "px";
        menu.style.top = anchorRect.top + "px";
    }

    openMenu = () => this.setState({ menuIsOpen: true });

    closeMenu = () => this.setState({ menuIsOpen: false });

    renderMenuWithPortal = () => {
        return ReactDOM.createPortal(
            <div ref={this.menuRef as React.RefObject<HTMLDivElement>}>
                <BaseMenu
                    anchorCorner={this.props.anchor}
                    open={this.state.menuIsOpen}
                    className={this.props.className}
                    onClose={this.closeMenu}
                    onSelect={this.props.onSelect}
                >
                    {this.props.children}
                </BaseMenu>
            </div>,
            getElement()
        );
    };

    renderCustomContent = () => {
        const { children } = this.props;
        return (
            <MenuSurface open={this.state.menuIsOpen} onClose={this.closeMenu}>
                {typeof children === "function"
                    ? children({ closeMenu: this.closeMenu })
                    : children}
            </MenuSurface>
        );
    };

    renderMenuContent = () => {
        return Array.isArray(this.props.children)
            ? this.renderMenuWithPortal()
            : this.renderCustomContent();
    };

    render() {
        return (
            <MenuSurfaceAnchor ref={this.anchorRef}>
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
