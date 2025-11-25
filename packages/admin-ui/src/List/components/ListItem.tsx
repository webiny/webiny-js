import * as React from "react";
import { cn, cva, makeDecoratable, withStaticProps, type VariantProps } from "~/utils.js";
import { Text } from "~/Text/index.js";
import { ListItemAction } from "./ListItemAction.js";
import { ListItemHandle } from "./ListItemHandle.js";
import { ListItemIcon } from "./ListItemIcon.js";

const listItemVariant = cva(
    [
        "w-full flex items-center",
        "group-[.list-background-base]:bg-neutral-base",
        "group-[.list-background-light]:bg-neutral-light",
        "group-[.list-variant-container]:rounded-lg",
        "group-[.list-variant-underline]:border-b-sm group-[.list-variant-underline]:border-b-neutral-dimmed",
        "hover:bg-neutral-dimmed!",
        "focus-visible:outline-none focus-visible:ring-sm focus-visible:ring-inset focus-visible:ring-primary-dimmed"
    ],
    {
        variants: {
            disabled: {
                true: "pointer-events-none opacity-50"
            },
            activated: {
                true: "bg-neutral-light!"
            },
            selected: {
                true: "bg-neutral-light!"
            },
            clickable: {
                true: "cursor-pointer"
            }
        }
    }
);

interface ListItemProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
        VariantProps<typeof listItemVariant> {
    title: React.ReactNode;
    actions?: React.ReactNode;
    description?: React.ReactNode;
    handle?: React.ReactNode;
    icon?: React.ReactNode;
    colorMark?: string;
}

const DecoratableListItem = ({
    actions,
    children,
    className,
    description,
    activated,
    disabled,
    selected,
    handle,
    icon,
    colorMark,
    onClick,
    title,
    ...props
}: ListItemProps) => {
    return (
        <div
            {...props}
            tabIndex={0}
            className={cn(
                listItemVariant({ disabled, activated, selected, clickable: Boolean(onClick) }),
                className
            )}
        >
            {handle}
            {colorMark && (
                <div
                    style={{ backgroundColor: colorMark }}
                    className={"block w-[4px] h-[48px] rounded-lg ml-sm"}
                />
            )}
            <div className={"w-full flex justify-between items-center pl-lg pr-md py-sm-extra"}>
                <div className={"w-full flex items-center gap-md"} onClick={onClick}>
                    {icon && <div>{icon}</div>}
                    <div className={"flex flex-col gap-xxs grow text-left"}>
                        <Text
                            size={"md"}
                            as={"div"}
                            className={"font-semibold text-neutral-primary"}
                        >
                            {title}
                        </Text>
                        <Text size={"sm"} as={"div"} className={"text-neutral-strong"}>
                            {description}
                        </Text>
                    </div>
                </div>
                {actions && <div className={"flex items-center gap-xs-plus"}>{actions}</div>}
            </div>
            {children}
        </div>
    );
};

const ListItem = withStaticProps(makeDecoratable("ListItem", DecoratableListItem), {
    Action: ListItemAction,
    Handle: ListItemHandle,
    Icon: ListItemIcon
});

export { ListItem, type ListItemProps };
