import React, { useState, useEffect, useCallback } from "react";
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

type MenuChildrenFunctionProps = {
    closeMenu: () => void;
};

type MenuProps = RmwcMenuProps & {
    // One or more MenuItem components.
    children: React.ReactNode | ((props: MenuChildrenFunctionProps) => React.ReactNode);

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

/**
 * Use Menu component to display a list of choices, once the handler is triggered.
 */
const Menu = (props: MenuProps) => {
    const {
        children,
        handle,
        anchor = "topStart",
        className,
        disabled,
        onOpen,
        onClose,
        onSelect,
        open,
        renderToPortal
    } = props;

    const [menuIsOpen, setMenuIsOpen] = useState(false);

    useEffect(() => {
        if (typeof open === "boolean") {
            setMenuIsOpen(open);
        }
    }, [open]);

    const openMenu = useCallback(() => {
        if (disabled) {
            return;
        }

        setMenuIsOpen(true);

        if (onOpen) {
            onOpen();
        }
    }, [disabled, onOpen]);

    const closeMenu = useCallback(() => {
        setMenuIsOpen(false);

        if (onClose) {
            onClose();
        }
    }, [onClose]);

    const renderMenuWithPortal = () => (
        <BaseMenu
            anchorCorner={anchor}
            open={menuIsOpen}
            className={className}
            onClose={closeMenu}
            onSelect={onSelect}
            renderToPortal={true}
            style={{ zIndex: 99 }} // Fixes Menu in Drawers
        >
            {children}
        </BaseMenu>
    );

    const renderCustomContent = () => (
        <MenuSurface open={menuIsOpen} onClose={closeMenu} renderToPortal={renderToPortal}>
            {typeof children === "function" ? children({ closeMenu }) : children}
        </MenuSurface>
    );

    return (
        <MenuSurfaceAnchor data-testid={props["data-testid"]}>
            {Array.isArray(children) ? renderMenuWithPortal() : renderCustomContent()}
            {handle && React.cloneElement(handle, { onClick: openMenu })}
        </MenuSurfaceAnchor>
    );
};

const MenuDivider: React.FC = () => {
    return <li className="mdc-list-divider" role="separator" />;
};

interface MenuItemProps extends BaseMenuItemProps {
    children: React.ReactNode;
    className?: string;
    onClick?: (event: React.MouseEvent) => void;
    "data-testid"?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ disabled, className, ...rest }) => {
    return (
        <BaseMenuItem
            {...rest}
            className={classNames(className, { [style.disabledMenuItem]: disabled })}
        />
    );
};

export { Menu, MenuItem, MenuDivider };
