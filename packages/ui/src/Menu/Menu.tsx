import React, { useMemo } from "react";
import { DropdownMenu as AdminUiDropdownMenu } from "@webiny/admin-ui/DropdownMenu/index.js";
import { ListItemGraphic } from "~/List/index.js";

export type MenuChildrenFunctionProps = {
    closeMenu: () => void;
};

export interface RenderableMenuChildren {
    (props: MenuChildrenFunctionProps): React.ReactNode;
}

export interface BaseMenuItemProps {
    /** Adds a ripple effect to the component */
    ripple?: any;
    /** A modifier for a selected state. */
    selected?: boolean;
    /** A modifier for an active state. */
    activated?: boolean;
    /** A modifier for a disabled state. */
    disabled?: boolean;
}

export type MenuProps = {
    /** Opens the menu. */
    open?: boolean;
    /** Make the menu position fixed. */
    fixed?: boolean;
    /** Renders the menu to a portal. Useful for situations where the content might be cutoff by an overflow: hidden container. You can pass "true" to render to the default RMWC portal. */
    renderToPortal?: any;
    /** Manually position the menu to one of the corners. */
    anchorCorner?: any;
    /** Children to render. */
    children?: React.ReactNode;
    /** An internal api for cross component communication. */
    apiRef?: (api: any | null) => void;
    /** Advanced: A reference to the MDCFoundation. */
    foundationRef?: any;
    /** Callback that fires when a Menu item is selected. evt.detail = { index: number; item: HTMLElement; } */
    onSelect?: (evt: any) => void;
    /** Whether or not to focus the first list item on open. Defaults to true. */
    focusOnOpen?: boolean;

    // A handler which triggers the menu, e.g. button or link.
    handle?: React.ReactElement;

    // @deprecated With the introduction of the new Admin UI, this prop is no longer supported, and it will be removed in future releases.
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

    // @deprecated With the introduction of the new Admin UI, this prop is no longer supported, and it will be removed in future releases.
    // If true, prevents menu from opening when clicked.
    disabled?: boolean;

    onOpen?: () => void;
    onClose?: () => void;

    // For testing purposes.
    "data-testid"?: string;

    // @deprecated With the introduction of the new Admin UI, this prop is no longer supported, and it will be removed in future releases.
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
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `DropdownMenu` component from the `@webiny/admin-ui` package instead.
 */
const Menu = (props: MenuProps) => {
    const {
        children,
        handle,

        className,
        onOpen,
        open,
        onClose

        // Deprecated properties.
        // disabled,
        // onSelect,
        // anchor = "topStart",
        // render,
        // renderToPortal,
        // portalZIndex = 99
    } = props;

    return (
        <AdminUiDropdownMenu
            open={open}
            trigger={handle}
            className={className}
            onOpenChange={open => {
                if (open) {
                    if (!onOpen) {
                        return;
                    }
                    onOpen();
                } else if (onClose) {
                    onClose();
                }
            }}
            data-testid={props["data-testid"]}
        >
            {typeof children === "function"
                ? children({
                      closeMenu: () => {
                          console.log(
                              "Deprecated: This function is deprecated and will be removed in future releases."
                          );
                      }
                  })
                : children}
        </AdminUiDropdownMenu>
    );
};

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `DropdownMenu.Separator` component from the `@webiny/admin-ui` package instead.
 */
const MenuDivider = () => {
    return <AdminUiDropdownMenu.Separator />;
};

interface MenuItemProps extends BaseMenuItemProps {
    children: React.ReactNode;
    className?: string;
    onClick?: (event: React.MouseEvent) => void;
    "data-testid"?: string;
}

const isIconElement = (element: React.ReactNode) => {
    return React.isValidElement(element) && element.type === ListItemGraphic;
};

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `DropdownMenu/Item` component from the `@webiny/admin-ui` package instead.
 */
const MenuItem = ({ children, ...rest }: MenuItemProps) => {
    const icon = useMemo(() => {
        const foundIcon = React.Children.toArray(children).find(isIconElement);
        // Handles this usage: packages/app-admin/src/components/OptionsMenu/OptionsMenuItem.tsx
        if (React.isValidElement(foundIcon) && foundIcon.type === ListItemGraphic) {
            return foundIcon.props.children;
        }
        return foundIcon;
    }, [children]);

    const content = useMemo(() => {
        return React.Children.toArray(children).filter(child => {
            return !isIconElement(child);
        });
    }, [children]);

    return <AdminUiDropdownMenu.Item icon={icon} text={content} {...rest} />;
};

export { Menu, MenuItem, MenuDivider };
