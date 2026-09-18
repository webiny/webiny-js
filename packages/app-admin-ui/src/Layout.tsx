import React from "react";
import Helmet from "react-helmet";
import type { LayoutProps } from "@webiny/app-admin";
import {
    debuggerStore,
    DebuggerIndicator,
    LayoutRenderer,
    Navigation,
    TenantSelector,
    UserMenu
} from "@webiny/app-admin";
import { observer } from "mobx-react-lite";
import { HeaderBar, cn, useSidebar } from "@webiny/admin-ui";

export const Layout = LayoutRenderer.createDecorator(() => {
    return observer(function Layout({
        title,
        startElement = null,
        hideNavigation = false,
        children
    }: LayoutProps) {
        const { pinned } = useSidebar();

        const widthClassNames = {
            "max-w-[calc(100%-(var(--spacing-sidebar-expanded)))] ": pinned,
            "max-w-[calc(100%-(var(--spacing-sidebar-collapsed)))] ": !pinned
        };

        return (
            <>
                {/*
                 * While capture is on the tab title is prefixed too, so an unattended session is
                 * noticeable without the tab being in focus.
                 */}
                {debuggerStore.enabled ? <Helmet titleTemplate={"● Debug — %s"} /> : null}
                {title ? <Helmet title={title} /> : null}
                {hideNavigation ? null : <Navigation />}
                <div
                    className={cn(
                        "ml-auto bg-neutral-base transition-[max-width,min-width] ease-linear w-full",
                        hideNavigation ? undefined : widthClassNames
                    )}
                >
                    <HeaderBar
                        start={startElement}
                        end={
                            <div className={"flex gap-x-sm items-center justify-end"}>
                                <DebuggerIndicator />
                                <TenantSelector />
                                <UserMenu />
                            </div>
                        }
                    />
                    <main className={"relative overflow-y-auto h-main-content"}>{children}</main>
                </div>
            </>
        );
    });
});
