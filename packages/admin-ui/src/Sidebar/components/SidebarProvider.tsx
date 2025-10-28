import React from "react";
import { cn } from "~/utils.js";
import { SIDEBAR_TRANSITION_DURATION } from "./constants.js";
import { SidebarCache } from "./SidebarCache.js";

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
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
    const context = React.useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider.");
    }

    return context;
}

type SidebarProviderProps = React.HTMLAttributes<HTMLDivElement>;

interface SidebarState {
    expanded: boolean;
    transition: null | "expanding" | "collapsing";
    pinned: boolean;
    expandedSections: string[];
}

const createInitialSidebarState = (): SidebarState => {
    const { pinned, expandedSections } = SidebarCache.get();
    return {
        expanded: pinned, // If pinned, we want the sidebar to be open by default.
        pinned,
        expandedSections,
        transition: null
    };
};

const SidebarProvider = ({ className, children, ...props }: SidebarProviderProps) => {
    const [sidebarState, setSidebarState] = React.useState<SidebarState>(createInitialSidebarState);

    // With this timeout, we prevent the sidebar glitching (quickly opening/closing) during mouse enter/leave events.
    const timeoutRef = React.useRef<number | null>(null);

    const { expanded, transition, pinned, expandedSections } = sidebarState;

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

            SidebarCache.set({ pinned: newValue, expandedSections });
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

                SidebarCache.set({ pinned: state.pinned, expandedSections });

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
            isSectionExpanded
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
            togglePinned
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

export { SidebarProvider, useSidebar };
