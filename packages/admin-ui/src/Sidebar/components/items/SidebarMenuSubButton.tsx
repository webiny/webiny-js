import React from "react";
import { cva } from "~/utils.js";
import type { SidebarMenuItemProps } from "./SidebarMenuRootItem.js";
import { DivButton } from "./DivButton.js";
import { DistributedOmit } from "type-fest";
import { useAdminUi } from "~/index.js";

const variants = cva(
    [
        "flex w-full cursor-pointer items-center gap-sm",
        "text-md text-neutral-primary no-underline!",
        "rounded-md p-xs-plus pr-sm outline-none",
        "whitespace-nowrap overflow-hidden",
        "hover:bg-neutral-dark/5",
        "group-hover/menu-sub-button:bg-neutral-dark/5",
        "focus:bg-neutral-dark/5 focus:ring-none focus:ring-transparent",
        "data-[active=true]:bg-neutral-dark/5 data-[active=true]:font-semibold data-[active=true]:pointer-events-none",
        "group-data-[state=collapsed]:hidden"
    ],
    {
        variants: {
            variant: {
                "group-label": [
                    "uppercase font-semibold text-neutral-muted! text-sm",
                    "pt-md pb-xs-plus pointer-events-none",
                    "hover:bg-transparent! group-hover/menu-sub-button:bg-transparent! focus:bg-transparent! cursor-default!"
                ]
            },
            disabled: {
                true: "pointer-events-none text-neutral-disabled!"
            }
        }
    }
);

type SidebarMenuSubButtonProps = DistributedOmit<SidebarMenuItemProps, "children">;

const SidebarMenuSubButton = ({
    onClick,
    variant,
    active,
    disabled,
    icon,
    action,
    text,
    className,
    to,
    ...linkProps
}: SidebarMenuSubButtonProps) => {
    const { linkComponent: LinkComponent } = useAdminUi();

    const sharedProps = {
        "data-sidebar": "menu-sub-button",
        "data-active": active,
        className: variants({ variant, disabled, className }),
        onClick
    };

    const content = to ? (
        <LinkComponent {...sharedProps} to={to} {...linkProps}>
            {icon}
            {text}
        </LinkComponent>
    ) : (
        // We can't use the default button element here because the content of the button
        // can also contain a button, which is not allowed in HTML.
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
        <div className={"flex items-center w-full relative group/menu-sub-button"}>
            {content}

            {action && (
                <div className="absolute top-0 right-0 mr-sm h-full flex items-center">
                    {action}
                </div>
            )}
        </div>
    );
};

export { SidebarMenuSubButton };
