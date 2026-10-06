import React, { useCallback, useMemo, useRef } from "react";
import Helmet from "react-helmet";
import type { LayoutProps } from "@webiny/app-admin";
import { AssumedPermissionsSelector } from "@webiny/app-admin";
import { BannerBar } from "@webiny/app-admin";
import { LayoutRenderer } from "@webiny/app-admin";
import { Navigation } from "@webiny/app-admin";
import { TenantSelector } from "@webiny/app-admin";
import { UserMenu } from "@webiny/app-admin";
import { HeaderBar, SidebarProvider, cn, useSidebar } from "@webiny/admin-ui";
import { useLocalStorage, useLocalStorageValue } from "@webiny/app";
import { CommandPalette } from "./CommandPalette/CommandPalette.js";
import { Breadcrumbs } from "./Breadcrumbs/Breadcrumbs.js";

const SIDEBAR_STATE_KEY = "navigation/state";

type SidebarCachedState = {
    pinned: boolean;
    expandedSections: string[];
    pinnedItems: string[];
};

const parseSidebarState = (raw: unknown): SidebarCachedState | undefined => {
    try {
        if (typeof raw === "object" && raw !== null) {
            return raw as SidebarCachedState;
        }
        if (typeof raw === "string") {
            return JSON.parse(raw) as SidebarCachedState;
        }
    } catch {
        // Ignore parse errors
    }
    return undefined;
};

/*
 * Views size themselves with `h-main-content`, which is the window minus the header. While the
 * banner bar shows, they have to lose its height too, or every page scrolls by exactly that much.
 * The bar is always `--spacing-banner` tall, so plain CSS can do it. Scoped to the wrapper below,
 * which holds both the bar and the views.
 *
 * TODO: Temporary. The real fix is for views to fill `main` instead of computing their own height
 * from the window: make this wrapper a full-height column and `main` `flex-1 min-h-0`, then move
 * the ~13 views that use `h-main-content` to `h-full`. That also lets the bar wrap its text.
 */
const MAKE_ROOM_FOR_BANNER =
    "has-[>[data-admin-banner]]:[--spacing-main-content:calc(100vh_-_var(--spacing-header)_-_var(--spacing-banner))]";

const LayoutContent = ({
    title,
    startElement = null,
    hideNavigation = false,
    children
}: LayoutProps) => {
    const { pinned } = useSidebar();

    const widthClassNames = {
        "max-w-[calc(100%-(var(--spacing-sidebar-expanded)))] ": pinned,
        "max-w-[calc(100%-(var(--spacing-sidebar-collapsed)))] ": !pinned
    };

    return (
        <>
            {title ? <Helmet title={title} /> : null}
            <CommandPalette />
            {hideNavigation ? null : <Navigation />}
            <div
                className={cn(
                    "ml-auto bg-neutral-base transition-[max-width,min-width] ease-linear w-full",
                    MAKE_ROOM_FOR_BANNER,
                    hideNavigation ? undefined : widthClassNames
                )}
            >
                <BannerBar />
                <HeaderBar
                    start={
                        <div className="flex items-center gap-sm">
                            <Breadcrumbs />
                            {startElement}
                        </div>
                    }
                    end={
                        <div className={"flex gap-x-sm items-center justify-end"}>
                            <TenantSelector />
                            <AssumedPermissionsSelector />
                            <UserMenu />
                        </div>
                    }
                />
                <main className={"relative overflow-y-auto h-main-content"}>{children}</main>
            </div>
        </>
    );
};

export const Layout = LayoutRenderer.createDecorator(() => {
    return function Layout(props: LayoutProps) {
        const localStorage = useLocalStorage();
        const localStorageRef = useRef(localStorage);
        localStorageRef.current = localStorage;

        const rawState = useLocalStorageValue(SIDEBAR_STATE_KEY);
        const cachedState = useMemo(() => parseSidebarState(rawState), [rawState]);

        const onChangeState = useCallback((newState: SidebarCachedState) => {
            localStorageRef.current.set(SIDEBAR_STATE_KEY, JSON.stringify(newState));
        }, []);

        return (
            <SidebarProvider state={cachedState} onChangeState={onChangeState}>
                <LayoutContent {...props} />
            </SidebarProvider>
        );
    };
});
