import React from "react";
import { SimpleLink } from "@webiny/app";
import { cva } from "~/utils.js";
import type { SidebarMenuItemProps } from "./SidebarMenuRootItem.js";
import { DivButton } from "./DivButton.js";
import { DistributedOmit } from "type-fest";

const variants = cva(
    [
        "wby-flex wby-w-full wby-cursor-pointer wby-items-center wby-gap-sm",
        "wby-text-md wby-text-neutral-primary !wby-no-underline",
        "wby-rounded-md wby-p-xs-plus wby-pr-sm wby-outline-none",
        "wby-whitespace-nowrap wby-overflow-hidden",
        "hover:wby-bg-neutral-dark/5",
        "focus:wby-bg-neutral-dark/5 focus:wby-ring-none focus:wby-ring-transparent",
        "data-[active=true]:wby-bg-neutral-dark/5 data-[active=true]:wby-font-semibold data-[active=true]:wby-pointer-events-none",
        "group-data-[state=collapsed]:wby-hidden",
        "group-data-[state=open]/menu-sub-item-collapsible:!wby-font-semibold"
    ],
    {
        variants: {
            variant: {
                "group-label": [
                    "wby-uppercase wby-font-semibold !wby-text-neutral-muted wby-text-sm",
                    "wby-pt-md wby-pb-xs-plus wby-pointer-events-none"
                ]
            },
            disabled: {
                true: "wby-pointer-events-none !wby-text-neutral-disabled"
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
        <div className={"wby-flex wby-items-center wby-w-full"}>
            {content}
            <div className={"wby-flex wby-absolute wby-right-[10px] wby-pointer-events-none"}>
                {action}
            </div>
        </div>
    );
};

export { SidebarMenuSubButton };
