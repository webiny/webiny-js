import React, { useCallback, useRef } from "react";
import { cn, cva } from "~/utils";
import { useSidebar } from "./SidebarProvider";

interface SidebarRootProps extends React.ComponentProps<"div"> {
    side?: "left" | "right";
}

const variants = cva(
    "wby-group wby-peer wby-block wby-border-r-sm wby-border-neutral-dimmed wby-bg-neutral-light",
    {
        variants: {
            pinned: {
                false: "wby-fixed wby-top-0 wby-z-10 "
            }
        }
    }
);

const SidebarRoot = ({ side = "left", className, children, ...props }: SidebarRootProps) => {
    const { state, setExpanded, pinned } = useSidebar();

    const elementRef = useRef<HTMLDivElement>(null);

    // With this timeout, we prevent the sidebar glitching (quickly opening/closing) during mouse enter/leave events.
    const timeoutRef = useRef<number | null>(null);

    const onMouseEnter = useCallback<React.MouseEventHandler<HTMLDivElement>>(() => {
        // If the sidebar is pinned, we don't want to open the sidebar on mouse enter.
        if (pinned) {
            return;
        }

        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        setExpanded(true);
    }, [pinned, setExpanded]);

    const onMouseLeave = useCallback<React.MouseEventHandler<HTMLDivElement>>(() => {
        // If the sidebar is pinned, we don't want to close the sidebar on mouse leave.
        if (pinned) {
            return;
        }

        // With this timeout, we prevent the sidebar glitching (quickly opening/closing) during mouse enter/leave events.
        timeoutRef.current = window.setTimeout(() => {
            setExpanded(false);
        }, 50);
    }, [pinned, setExpanded]);

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            ref={elementRef}
            data-state={state}
            data-sidebar={"root"}
            data-side={side}
            className={variants({ pinned })}
        >
            <div
                className={cn(
                    "wby-duration-175 wby-relative wby-h-svh wby-w-sidebar-expanded wby-bg-transparent wby-transition-[width] wby-ease-linear wby-duration-175",
                    "group-data-[side=right]:wby-rotate-180",
                    "group-data-[state=collapsed]:wby-w-sidebar-collapsed"
                )}
            />
            <div
                className={cn(
                    "wby-duration-175 wby-fixed wby-inset-y-0 wby-z-10 wby-h-svh wby-w-sidebar-expanded wby-transition-[width] wby-ease-linear md:wby-flex",
                    side === "left" ? "wby-left-0" : "wby-right-0",
                    "group-data-[state=collapsed]:wby-w-sidebar-collapsed group-data-[side=left]:wby-border-r-px group-data-[side=right]:wby-border-l-px",
                    className
                )}
                {...props}
            >
                <div
                    data-sidebar="sidebar"
                    className="wby-flex wby-h-full wby-w-full wby-py-xs wby-flex-col"
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

export { SidebarRoot, type SidebarRootProps };
