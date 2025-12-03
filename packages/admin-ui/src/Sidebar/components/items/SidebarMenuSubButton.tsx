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
        "focus:bg-neutral-dark/5 focus:ring-none focus:ring-transparent",
        "data-[active=true]:bg-neutral-dark/5 data-[active=true]:font-semibold data-[active=true]:pointer-events-none",
        "group-data-[state=collapsed]:hidden"
    ],
    {
        variants: {
            variant: {
                "group-label": [
                    "uppercase font-semibold text-neutral-muted! text-sm",
                    "pt-md pb-xs-plus pointer-events-none"
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
    const chevron = action ? (
        <div className="flex ml-auto pointer-events-none">{action}</div>
    ) : null;

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
            {chevron}
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
            {chevron}
        </DivButton>
    );

    return <div className={"flex items-center w-full"}>{content}</div>;
};

export { SidebarMenuSubButton };
