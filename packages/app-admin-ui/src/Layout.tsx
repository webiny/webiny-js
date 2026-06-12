import React, { useCallback, useMemo, useRef } from "react";
import Helmet from "react-helmet";
import type { LayoutProps } from "@webiny/app-admin";
import { LayoutRenderer, Navigation, TenantSelector, UserMenu } from "@webiny/app-admin";
import { HeaderBar, SidebarProvider, cn, useSidebar } from "@webiny/admin-ui";
import { useLocalStorage, useLocalStorageValue } from "@webiny/app";

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
                            <TenantSelector />
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
