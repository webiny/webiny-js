import * as React from "react";
import { makeDecoratable, withStaticProps } from "~/utils.js";
import { SidebarRoot } from "./components/SidebarRoot.js";
import { SidebarHeader } from "./components/SidebarHeader.js";
import { SidebarContent } from "./components/SidebarContent.js";
import { SidebarIcon } from "./components/SidebarIcon.js";
import { SidebarFooter } from "./components/SidebarFooter.js";
import { SidebarMenuItem } from "./components/items/SidebarMenuItem.js";
import { SidebarMenuLink } from "./components/items/SidebarMenuLink.js";
import { SidebarMenuRoot } from "./components/items/SidebarMenuRoot.js";
import { SidebarMenuGroup } from "~/Sidebar/components/items/SidebarMenuGroup.js";

interface SidebarProps
    extends
        Omit<React.ComponentPropsWithoutRef<typeof SidebarRoot>, "title">,
        Omit<React.ComponentPropsWithoutRef<typeof SidebarContent>, "title"> {
    title?: React.ReactNode;
    icon?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

const SidebarBase = (props: SidebarProps) => {
    const { headerProps, rootProps, footerProps, contentProps } = React.useMemo(() => {
        const {
            // Header props.
            title,
            icon,

            // Root props.
            side,

            // Footer props.
            footer,

            // Content props.
            ...rest
        } = props;

        return {
            headerProps: {
                title,
                icon
            },
            rootProps: {
                side
            },
            footerProps: {
                footer
            },
            contentProps: rest
        };
    }, [props]);

    return (
        <SidebarRoot {...rootProps}>
            <SidebarHeader {...headerProps} />
            <SidebarContent {...contentProps}>
                <SidebarMenuRoot showPinnedItems={true}>{props.children}</SidebarMenuRoot>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenuRoot showPinnedItems={false}>{footerProps.footer}</SidebarMenuRoot>
            </SidebarFooter>
        </SidebarRoot>
    );
};

const DecoratableSidebar = makeDecoratable("Sidebar", SidebarBase);

const Sidebar = withStaticProps(DecoratableSidebar, {
    Item: SidebarMenuItem,
    Link: SidebarMenuLink,
    Group: SidebarMenuGroup,
    Icon: SidebarIcon
});

export { Sidebar };
