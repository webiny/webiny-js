import * as React from "react";
import { makeDecoratable, withStaticProps } from "~/utils.js";
import { DropdownMenuRoot } from "./components/DropdownMenuRoot.js";
import { DropdownMenuTrigger } from "./components/DropdownMenuTrigger.js";
import { DropdownMenuContent } from "./components/DropdownMenuContent.js";
import { DropdownMenuSeparator } from "./components/DropdownMenuSeparator.js";
import { DropdownMenuItem, type DropdownMenuItemProps } from "./components/DropdownMenuItem.js";
import { DropdownMenuLink, type DropdownMenuLinkProps } from "./components/DropdownMenuLink.js";
import { DropdownMenuCheckboxItem } from "./components/DropdownMenuCheckboxItem.js";
import { DropdownMenuLabel } from "./components/DropdownMenuLabel.js";
import { DropdownMenuGroup } from "./components/DropdownMenuGroup.js";
import { DropdownMenuPortal } from "./components/DropdownMenuPortal.js";

interface DropdownMenuProps
    extends React.ComponentPropsWithoutRef<typeof DropdownMenuRoot>,
        React.ComponentPropsWithoutRef<typeof DropdownMenuContent> {
    trigger?: React.ReactNode;
    children: React.ReactNode;
}

const DropdownMenuBase = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuRoot>,
    DropdownMenuProps
>((props, ref) => {
    const { rootProps, triggerProps, contentProps } = React.useMemo(() => {
        const {
            // Root props.
            defaultOpen,
            open,
            onOpenChange,

            dir,

            // Trigger props.
            trigger,

            // Content props.
            ...rest
        } = props;

        return {
            rootProps: {
                defaultOpen,
                open,
                onOpenChange,
                dir
            },
            triggerProps: {
                // Temporary fix. We need this because `ref` doesn't get passed to components
                // that are decorated with `makeDecoratable`. This will be fixed in the future.
                children: (
                    <div className={"wby-inline-block wby-text-0 wby-leading-none"}>{trigger}</div>
                )
            },
            contentProps: rest
        };
    }, [props]);

    return (
        <DropdownMenuRoot {...rootProps}>
            {triggerProps.children && <DropdownMenuTrigger {...triggerProps} asChild />}
            <DropdownMenuPortal>
                <DropdownMenuContent {...contentProps} ref={ref} />
            </DropdownMenuPortal>
        </DropdownMenuRoot>
    );
});

DropdownMenuBase.displayName = "DropdownMenu";

const DecoratableDropdownMenu = makeDecoratable("DropdownMenu", DropdownMenuBase);

const DropdownMenu = withStaticProps(DecoratableDropdownMenu, {
    Separator: DropdownMenuSeparator,
    Label: DropdownMenuLabel,
    Group: DropdownMenuGroup,
    Item: DropdownMenuItem,
    Link: DropdownMenuLink,
    CheckboxItem: DropdownMenuCheckboxItem
});

export { DropdownMenu, type DropdownMenuItemProps, type DropdownMenuLinkProps };
