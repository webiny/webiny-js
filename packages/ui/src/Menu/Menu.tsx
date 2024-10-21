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

export type MenuChildrenFunctionProps = {
    closeMenu: () => void;
};

export interface RenderableMenuChildren {
    (props: MenuChildrenFunctionProps): React.ReactNode;
}

export type MenuProps = Omit<RmwcMenuProps, "children"> & {
    // A handler which triggers the menu, e.g. button or link.
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

    // If rendering to portal, you can specify an exact zIndex.
    portalZIndex?: number;
} & ( // You can use either `children` or `render`, but not both.
        | {
              // One or more MenuItem components.
              children: React.ReactNode | RenderableMenuChildren;
              render?: never;
          }
        | {
              render: RenderableMenuChildren;
              children?: never;
          }
    );

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
        render,
        renderToPortal,
        portalZIndex = 99
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
            style={{ zIndex: portalZIndex }} // Fixes Menu in Drawers
        >
            <>{children}</>
        </BaseMenu>
    );

    const renderCustomContent = () => {
        const renderer = render || children;
        return (
            <MenuSurface open={menuIsOpen} onClose={closeMenu} renderToPortal={renderToPortal}>
                {typeof renderer === "function" ? renderer({ closeMenu }) : renderer}
            </MenuSurface>
        );
    };

    return (
        <MenuSurfaceAnchor data-testid={props["data-testid"]}>
            {Array.isArray(children) ? renderMenuWithPortal() : renderCustomContent()}
            {handle && React.cloneElement(handle, { onClick: openMenu })}
        </MenuSurfaceAnchor>
    );
};

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
