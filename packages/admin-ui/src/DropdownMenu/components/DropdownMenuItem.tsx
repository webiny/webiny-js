import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { cn, cva, makeDecoratable } from "~/utils.js";
import { DropdownMenuSubRoot } from "./DropdownMenuSubRoot.js";
import { DropdownMenuSubTrigger } from "./DropdownMenuSubTrigger.js";
import { DropdownMenuPortal } from "./DropdownMenuPortal.js";
import { DropdownMenuSubContent } from "./DropdownMenuSubContent.js";
import { DropdownMenuItemIcon, type DropdownMenuItemIconProps } from "./DropdownMenuItemIcon.js";
import { LinkComponentProps, useAdminUi } from "~/index.js";

interface DropdownMenuItemBaseProps {
    icon?: React.ReactNode;
    readOnly?: boolean;
    text?: React.ReactNode;
    disabled?: boolean;
    onClick?: React.MouseEventHandler;
}

type DropdownMenuItemButtonProps = (DropdownMenuItemBaseProps &
    React.HTMLAttributes<HTMLDivElement>) & { to?: never };
type DropdownMenuItemLinkProps = DropdownMenuItemBaseProps & LinkComponentProps;

type DropdownMenuItemProps = DropdownMenuItemButtonProps | DropdownMenuItemLinkProps;

const variants = cva(
    [
        "wby-group wby-relative wby-cursor-default wby-select-none wby-items-center wby-rounded-sm",
        "wby-text-md wby-text-neutral-primary !wby-no-underline",
        "wby-px-xs-plus wby-outline-none wby-transition-colors",
        "[&_svg]:wby-fill-neutral-xstrong [&_svg]:wby-pointer-events-none [&_svg]:wby-size-md [&_svg]:wby-shrink-0",
        "data-[disabled]:wby-pointer-events-none data-[disabled]:wby-text-neutral-disabled",
        "[&_a]:!wby-no-underline [&_a]:!wby-text-neutral-primary"
    ],
    {
        variants: {
            readOnly: {
                true: "wby-pointer-events-none"
            }
        },
        defaultVariants: {
            readOnly: false
        }
    }
);

const DropdownMenuItemBase = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Item>,
    DropdownMenuItemProps
>(({ className, icon, text, readOnly, disabled, onClick, children, ...linkProps }, ref) => {
    const { linkComponent: LinkComponent } = useAdminUi();

    if (children) {
        return (
            <DropdownMenuSubRoot>
                <DropdownMenuSubTrigger>
                    {icon}
                    <span>{text}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent>{children}</DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSubRoot>
        );
    }
    const sharedProps = {
        className: cn(
            "wby-flex wby-px-sm wby-py-xs-plus wby-gap-sm-extra wby-items-center wby-text-md wby-rounded-sm wby-transition-colors group-focus:wby-bg-neutral-dimmed",
            {
                "[&_svg]:!wby-fill-neutral-disabled": disabled
            }
        )
    };

    const content = linkProps.to ? (
        <LinkComponent {...sharedProps} {...linkProps}>
            {icon}
            <span>{text}</span>
        </LinkComponent>
    ) : (
        <div {...sharedProps} onClick={onClick}>
            {icon}
            <span>{text}</span>
        </div>
    );

    return (
        <DropdownMenuPrimitive.Item
            disabled={disabled}
            ref={ref}
            className={cn(variants({ readOnly }), className)}
        >
            {content}
        </DropdownMenuPrimitive.Item>
    );
});

DropdownMenuItemBase.displayName = DropdownMenuPrimitive.Item.displayName;

const DecoratableDropdownMenuItem = makeDecoratable("DropdownMenuItem", DropdownMenuItemBase);

const DropdownMenuItem = Object.assign(DecoratableDropdownMenuItem, {
    Icon: DropdownMenuItemIcon
});

export {
    DropdownMenuItem,
    type DropdownMenuItemProps,
    type DropdownMenuItemButtonProps,
    type DropdownMenuItemLinkProps,
    type DropdownMenuItemIconProps
};
