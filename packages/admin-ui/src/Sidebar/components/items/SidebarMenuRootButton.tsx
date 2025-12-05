import React from "react";
import { cn, cva } from "~/utils.js";
import type { SidebarMenuItemProps } from "./SidebarMenuRootItem.js";
import { DivButton } from "./DivButton.js";
import { useAdminUi } from "~/index.js";

const variants = cva(
    [
        "flex w-full items-center gap-sm rounded-md",
        "no-underline! text-neutral-primary cursor-pointer px-sm py-xs-plus text-left",
        "text-md outline-none transition-[width,height,padding]",
        "whitespace-nowrap overflow-hidden",
        "hover:bg-neutral-dark/5",
        "group-hover/menu-root-button:bg-neutral-dark/5",
        "focus:bg-neutral-dark/5 focus:ring-none focus:ring-transparent",
        "data-[active=true]:bg-neutral-dark/5 data-[active=true]:font-semibold data-[active=true]:pointer-events-none",
        "group-data-[state=open]/menu-item-collapsible:font-semibold!"
    ],
    {
        variants: {
            variant: {
                "group-label":
                    "text-neutral-muted! uppercase hover:bg-transparent! group-hover/menu-root-button:bg-transparent! focus:bg-transparent! cursor-default!"
            },
            disabled: {
                true: "pointer-events-none text-neutral-disabled!"
            }
        }
    }
);

type SidebarMenuButtonBaseProps = Omit<SidebarMenuItemProps, "children">;

const SidebarMenuRootButton = ({
    className,
    onClick,
    variant,
    active,
    disabled,
    icon,
    action,
    text,
    to,
    ...linkProps
}: SidebarMenuButtonBaseProps) => {
    const sharedProps = {
        "data-sidebar": "menu-button",
        "data-active": active,
        className: variants({ variant, disabled }),
        onClick
    };

    const { linkComponent: LinkComponent } = useAdminUi();

    const content = to ? (
        <LinkComponent {...sharedProps} to={to} {...linkProps}>
            {icon}
            {text}
        </LinkComponent>
    ) : (
        <DivButton
            {...sharedProps}
            disabled={disabled}
            tabIndex={variant === "group-label" ? -1 : undefined}
        >
            {icon}
            {text}
        </DivButton>
    );

    return (
        <div className={cn("flex items-center w-full relative group/menu-root-button", className)}>
            {content}
            {action && (
                <div className="absolute top-0 right-0 mr-sm h-full flex items-center">
                    {action}
                </div>
            )}
        </div>
    );
};

export { SidebarMenuRootButton };
