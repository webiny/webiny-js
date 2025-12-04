import React, { useMemo } from "react";
import { SidebarProvider as AdminUiSidebar } from "@webiny/admin-ui";
import { useLocalStorage, useLocalStorageValue } from "@webiny/app";

interface NavigationProviderProps {
    children?: React.ReactNode;
}

const PINNED_ITEMS_KEY = "navigation/pinned/items";

export const SidebarProvider = (Component: React.ComponentType<NavigationProviderProps>) => {
    return function SidebarProvider(props: NavigationProviderProps) {
        const rawPinnedItems = useLocalStorageValue(PINNED_ITEMS_KEY);
        const { set } = useLocalStorage();

        const pinnedItems = useMemo(() => {
            try {
                if (Array.isArray(rawPinnedItems)) {
                    return rawPinnedItems;
                }
                if (typeof rawPinnedItems === "string") {
                    const parsed = JSON.parse(rawPinnedItems);
                    return Array.isArray(parsed) ? parsed : [];
                }
            } catch {
                // Ignore parse errors
            }
            return [];
        }, [rawPinnedItems]);

        const setPinnedItems = (items: string[]) => {
            set(PINNED_ITEMS_KEY, JSON.stringify(items));
        };

        return (
            <AdminUiSidebar pinnedItems={pinnedItems} onChangePinnedItems={setPinnedItems}>
                <Component {...props} />
            </AdminUiSidebar>
        );
    };
};
