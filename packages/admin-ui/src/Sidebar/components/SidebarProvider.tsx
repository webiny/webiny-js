import React from "react";
import { cn } from "~/utils.js";
import { SIDEBAR_TRANSITION_DURATION } from "./constants.js";

type PinnedItemData = {
    id: string;
    text: React.ReactNode;
    icon?: React.ReactNode;
    to?: string;
    onClick?: React.MouseEventHandler;
    active?: boolean;
};

type SidebarContext = {
    state: "expanded" | "collapsed";
    expanded: boolean;
    expandedSections: string[];
    pinned: boolean;
    transition: null | "expanding" | "collapsing";
    setExpanded: (expanded: boolean) => void;
    toggleExpanded: () => void;
    togglePinned: () => void;
    toggleSectionExpanded: (sectionId: string) => void;
    isSectionExpanded: (sectionId: string) => boolean;
    pinnedItems: string[];
    toggleItemPinned: (itemId: string) => void;
    isItemPinned: (itemId: string) => boolean;
    registerPinnedItem: (data: PinnedItemData) => void;
    unregisterPinnedItem: (itemId: string) => void;
    getPinnedItemsData: () => PinnedItemData[];
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
    const context = React.useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider.");
    }

    return context;
}

type SidebarCachedState = {
    pinned: boolean;
    expandedSections: string[];
    pinnedItems: string[];
};

type SidebarProviderProps = React.HTMLAttributes<HTMLDivElement> & {
    state?: SidebarCachedState;
    onChangeState?: (state: SidebarCachedState) => void;
};

interface SidebarState {
    expanded: boolean;
    transition: null | "expanding" | "collapsing";
    pinned: boolean;
    expandedSections: string[];
    pinnedItems: string[];
}

const createInitialSidebarState = (state?: SidebarCachedState): SidebarState => {
    const pinned = state?.pinned ?? false;
    const expandedSections = state?.expandedSections ?? [];
    const pinnedItems = state?.pinnedItems ?? [];
    return {
        expanded: pinned, // If pinned, we want the sidebar to be open by default.
        pinned,
        expandedSections,
        pinnedItems,
        transition: null
    };
};

const SidebarProvider = ({
    className,
    children,
    state: cachedState,
    onChangeState,
    ...props
}: SidebarProviderProps) => {
    const [sidebarState, setSidebarState] = React.useState<SidebarState>(() =>
        createInitialSidebarState(cachedState)
    );
    const [pinnedItemsData, setPinnedItemsData] = React.useState<Map<string, PinnedItemData>>(
        new Map()
    );

    // With this timeout, we prevent the sidebar glitching (quickly opening/closing) during mouse enter/leave events.
    const timeoutRef = React.useRef<number | null>(null);
    const isInitialMount = React.useRef(true);

    const { expanded, transition, pinned, expandedSections, pinnedItems } = sidebarState;

    // Sync state changes to parent via useEffect
    React.useEffect(() => {
        // Skip the initial mount to avoid unnecessary state sync
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (onChangeState) {
            onChangeState({
                pinned,
                expandedSections,
                pinnedItems
            });
        }
    }, [pinned, expandedSections, pinnedItems, onChangeState]);

    const setExpanded = React.useCallback(
        (value: boolean | ((value: boolean) => boolean)) => {
            const newValue = typeof value === "function" ? value(expanded) : value;
            setSidebarState(state => ({
                ...state,
                expanded: newValue,
                transition: newValue ? "expanding" : "collapsing"
            }));

            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = window.setTimeout(() => {
                setSidebarState(state => ({
                    ...state,
                    transition: null
                }));
            }, SIDEBAR_TRANSITION_DURATION);
        },
        [expanded]
    );

    const setPinned = React.useCallback(
        (value: boolean | ((value: boolean) => boolean)) => {
            const newValue = typeof value === "function" ? value(pinned) : value;
            setSidebarState(state => ({
                ...state,
                pinned: newValue
            }));
        },
        [pinned]
    );

    const toggleExpanded = React.useCallback(() => {
        return setExpanded(prev => !prev);
    }, [setExpanded]); // Helper to toggle the sidebar.

    const togglePinned = React.useCallback(() => {
        return setPinned(prev => !prev);
    }, [setPinned]);

    const toggleSectionExpanded = React.useCallback(
        (sectionId: string) => {
            setSidebarState(state => {
                const expandedSections = state.expandedSections.includes(sectionId)
                    ? state.expandedSections.filter(id => id !== sectionId)
                    : [...state.expandedSections, sectionId];

                return {
                    ...state,
                    expandedSections
                };
            });
        },
        [setSidebarState]
    );

    const isSectionExpanded = React.useCallback(
        (sectionId: string) => {
            return expandedSections.includes(sectionId);
        },
        [expandedSections]
    );

    const toggleItemPinned = React.useCallback(
        (itemId: string) => {
            setSidebarState(state => {
                const newPinnedItems = state.pinnedItems.includes(itemId)
                    ? state.pinnedItems.filter(id => id !== itemId)
                    : [...state.pinnedItems, itemId];

                return {
                    ...state,
                    pinnedItems: newPinnedItems
                };
            });
        },
        [setSidebarState]
    );

    const isItemPinned = React.useCallback(
        (itemId: string) => {
            return pinnedItems.includes(itemId);
        },
        [pinnedItems]
    );

    const registerPinnedItem = React.useCallback((data: PinnedItemData) => {
        setPinnedItemsData(prev => {
            const newMap = new Map(prev);
            newMap.set(data.id, data);
            return newMap;
        });
    }, []);

    const unregisterPinnedItem = React.useCallback((itemId: string) => {
        setPinnedItemsData(prev => {
            const newMap = new Map(prev);
            newMap.delete(itemId);
            return newMap;
        });
    }, []);

    const getPinnedItemsData = React.useCallback(() => {
        // Sort by the order in pinnedItems array to maintain consistent ordering
        return pinnedItems
            .map(id => pinnedItemsData.get(id))
            .filter((item): item is PinnedItemData => item !== undefined);
    }, [pinnedItemsData, pinnedItems]);

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = expanded ? "expanded" : "collapsed";

    const contextValue = React.useMemo<SidebarContext>(
        () => ({
            state,
            transition,
            expanded,
            expandedSections,
            pinned,
            setExpanded,
            toggleExpanded,
            toggleSectionExpanded,
            setPinned,
            togglePinned,
            isSectionExpanded,
            pinnedItems,
            toggleItemPinned,
            isItemPinned,
            registerPinnedItem,
            unregisterPinnedItem,
            getPinnedItemsData
        }),
        [
            state,
            transition,
            expanded,
            expandedSections,
            pinned,
            setExpanded,
            setPinned,
            toggleExpanded,
            togglePinned,
            pinnedItems,
            toggleItemPinned,
            isItemPinned,
            registerPinnedItem,
            unregisterPinnedItem,
            getPinnedItemsData
        ]
    );

    return (
        <SidebarContext.Provider value={contextValue}>
            <div
                data-sidebar={"provider"}
                {...props}
                className={cn("group/sidebar-wrapper flex min-h-svh w-full", className)}
            >
                {children}
            </div>
        </SidebarContext.Provider>
    );
};
SidebarProvider.displayName = "SidebarProvider";

export { SidebarProvider, useSidebar, type PinnedItemData };
