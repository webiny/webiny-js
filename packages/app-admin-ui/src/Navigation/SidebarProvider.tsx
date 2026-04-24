import React, { useMemo } from "react";
import { SidebarProvider as AdminUiSidebar } from "@webiny/admin-ui";
import { useLocalStorage, useLocalStorageValue } from "@webiny/app";

interface NavigationProviderProps {
    children?: React.ReactNode;
}

const SIDEBAR_STATE_KEY = "navigation/state";

type SidebarState = {
    pinned: boolean;
    expandedSections: string[];
    pinnedItems: string[];
};

export const SidebarProvider = (Component: React.ComponentType<NavigationProviderProps>) => {
    return function SidebarProvider(props: NavigationProviderProps) {
        const rawState = useLocalStorageValue(SIDEBAR_STATE_KEY);
        const { set } = useLocalStorage();

        const state = useMemo(() => {
            try {
                if (typeof rawState === "object" && rawState !== null) {
                    return rawState as SidebarState;
                }
                if (typeof rawState === "string") {
                    return JSON.parse(rawState) as SidebarState;
                }
            } catch {
                // Ignore parse errors
            }
            return undefined;
        }, [rawState]);

        const onChangeState = (newState: SidebarState) => {
            set(SIDEBAR_STATE_KEY, JSON.stringify(newState));
        };

        return (
            <AdminUiSidebar state={state} onChangeState={onChangeState}>
                <Component {...props} />
            </AdminUiSidebar>
        );
    };
};
