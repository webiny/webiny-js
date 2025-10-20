import React, { useCallback, useRef } from "react";
import { cn, cva } from "~/utils.js";
import { useSidebar } from "./SidebarProvider.js";

interface SidebarRootProps extends React.ComponentProps<"div"> {
    side?: "left" | "right";
}

const variants = cva(
    "group peer block border-r-sm border-neutral-dimmed bg-neutral-light",
    {
        variants: {
            pinned: {
                false: "fixed top-0 z-10 "
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
                    "duration-175 relative h-svh w-sidebar-expanded bg-transparent transition-[width] ease-linear duration-175",
                    "group-data-[side=right]:rotate-180",
                    "group-data-[state=collapsed]:w-sidebar-collapsed"
                )}
            />
            <div
                className={cn(
                    "duration-175 fixed inset-y-0 z-10 h-svh w-sidebar-expanded transition-[width] ease-linear md:flex",
                    side === "left" ? "left-0" : "right-0",
                    "group-data-[state=collapsed]:w-sidebar-collapsed group-data-[side=left]:border-r-px group-data-[side=right]:border-l-px",
                    className
                )}
                {...props}
            >
                <div
                    data-sidebar="sidebar"
                    className="flex h-full w-full py-xs flex-col"
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

export { SidebarRoot, type SidebarRootProps };
