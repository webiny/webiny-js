import React from "react";
import { cn, cva } from "~/utils.js";
import type { SidebarMenuItemProps } from "./SidebarMenuRootItem.js";
import { DivButton } from "./DivButton.js";
import { useAdminUi } from "~/index.js";

const variants = cva(
    [
        "flex w-full items-center gap-sm rounded-md",
        "!no-underline text-neutral-primary cursor-pointer px-sm py-xs-plus text-left",
        "text-md outline-none transition-[width,height,padding]",
        "whitespace-nowrap overflow-hidden",
        "hover:bg-neutral-dark/5",
        "focus:bg-neutral-dark/5 focus:ring-none focus:ring-transparent",
        "data-[active=true]:bg-neutral-dark/5 data-[active=true]:font-semibold data-[active=true]:pointer-events-none",
        "group-data-[state=open]/menu-item-collapsible:!font-semibold"
    ],
    {
        variants: {
            variant: {
                "group-label": "!text-neutral-muted uppercase"
            },
            disabled: {
                true: "pointer-events-none !text-neutral-disabled"
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

    const chevron = action ? (
        <div className="flex absolute right-sm-plus">{action}</div>
    ) : null;

    const { linkComponent: LinkComponent } = useAdminUi();

    const content = to ? (
        <LinkComponent {...sharedProps} to={to} {...linkProps}>
            {icon}
            {text}
            {chevron}
        </LinkComponent>
    ) : (
        <DivButton
            {...sharedProps}
            disabled={disabled}
            tabIndex={variant === "group-label" ? -1 : undefined}
        >
            {icon}
            {text}
            {chevron}
        </DivButton>
    );

    return <div className={cn("flex items-center w-full", className)}>{content}</div>;
};

export { SidebarMenuRootButton };
