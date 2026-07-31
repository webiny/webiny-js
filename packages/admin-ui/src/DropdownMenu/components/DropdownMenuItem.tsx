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
    variant?: "destructive";
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
        "group relative cursor-default select-none items-center rounded-sm",
        "text-md text-neutral-primary no-underline!",
        "px-xs-plus outline-none transition-colors",
        "[&_svg]:fill-neutral-xstrong [&_svg]:pointer-events-none [&_svg]:size-md [&_svg]:shrink-0",
        "data-disabled:pointer-events-none data-disabled:text-neutral-disabled",
        "[&_a]:no-underline! [&_a]:text-neutral-primary!"
    ],
    {
        variants: {
            variant: {
                destructive: ["text-destructive-primary!", "[&_svg]:fill-destructive"]
            },
            readOnly: {
                true: "pointer-events-none"
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
>(
    (
        { className, icon, text, readOnly, variant, disabled, onClick, children, ...linkProps },
        ref
    ) => {
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
                "flex px-sm py-xs-plus gap-sm-extra items-center text-md rounded-sm transition-colors group-focus:bg-neutral-dimmed",
                {
                    "[&_svg]:fill-neutral-disabled!": disabled
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
                className={cn(variants({ readOnly, variant }), className)}
            >
                {content}
            </DropdownMenuPrimitive.Item>
        );
    }
);

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
