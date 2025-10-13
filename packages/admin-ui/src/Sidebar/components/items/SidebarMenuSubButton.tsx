import React from "react";
import { SimpleLink } from "@webiny/app";
import { cva } from "~/utils.js";
import type { SidebarMenuItemProps } from "./SidebarMenuRootItem.js";
import { DivButton } from "./DivButton.js";
import { DistributedOmit } from "type-fest";

const variants = cva(
    [
        "flex w-full cursor-pointer items-center gap-sm",
        "text-md text-neutral-primary !no-underline",
        "rounded-md p-xs-plus pr-sm outline-none",
        "whitespace-nowrap overflow-hidden",
        "hover:bg-neutral-dark/5",
        "focus:bg-neutral-dark/5 focus:ring-none focus:ring-transparent",
        "data-[active=true]:bg-neutral-dark/5 data-[active=true]:font-semibold data-[active=true]:pointer-events-none",
        "group-data-[state=collapsed]:hidden",
        "group-data-[state=open]/menu-sub-item-collapsible:!font-semibold"
    ],
    {
        variants: {
            variant: {
                "group-label": [
                    "uppercase font-semibold !text-neutral-muted text-sm",
                    "pt-md pb-xs-plus pointer-events-none"
                ]
            },
            disabled: {
                true: "pointer-events-none !text-neutral-disabled"
            }
        }
    }
);

type SidebarMenuSubButtonProps = DistributedOmit<SidebarMenuItemProps, "className" | "children">;

const SidebarMenuSubButton = ({
    onClick,
    variant,
    active,
    disabled,
    icon,
    action,
    text,
    to,
    ...linkProps
}: SidebarMenuSubButtonProps) => {
    const sharedProps = {
        "data-sidebar": "menu-button",
        "data-active": active,
        className: variants({ variant, disabled }),
        onClick
    };

    const content = to ? (
        <SimpleLink {...sharedProps} to={to} {...linkProps}>
            {icon}
            {text}
        </SimpleLink>
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

    // We can't use the default button element here because the content of the button
    // can also contain a button, which is not allowed in HTML.
    return (
        <div className={"flex items-center w-full"}>
            {content}
            <div className={"flex absolute right-[10px]"}>{action}</div>
        </div>
    );
};

export { SidebarMenuSubButton };
