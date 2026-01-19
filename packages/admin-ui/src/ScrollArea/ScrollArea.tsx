import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "~/utils.js";

export interface ScrollPosition {
    top: number;
    left: number;
    scrollTop: number;
    scrollLeft: number;
    scrollHeight: number;
    scrollWidth: number;
    clientHeight: number;
    clientWidth: number;
}

interface ScrollAreaProps
    extends Omit<React.ComponentProps<typeof ScrollAreaPrimitive.Root>, "onScroll"> {
    onScrollPositionChange?: (position: ScrollPosition) => void;
    onScroll?: (position: ScrollPosition) => void;
}

function ScrollArea({
    className,
    children,
    onScrollPositionChange,
    onScroll,
    ...props
}: ScrollAreaProps) {
    const viewportRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport || (!onScrollPositionChange && !onScroll)) {
            return;
        }

        // The Viewport component itself is the scrollable element.
        const handleScroll = () => {
            const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } =
                viewport;

            const position: ScrollPosition = {
                top: scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0,
                left: scrollWidth > clientWidth ? scrollLeft / (scrollWidth - clientWidth) : 0,
                scrollTop,
                scrollLeft,
                scrollHeight,
                scrollWidth,
                clientHeight,
                clientWidth
            };

            onScrollPositionChange?.(position);
            onScroll?.(position);
        };

        // Call handleScroll initially to provide initial position.
        handleScroll();

        viewport.addEventListener("scroll", handleScroll);
        return () => viewport.removeEventListener("scroll", handleScroll);
    }, [onScrollPositionChange, onScroll]);

    return (
        <ScrollAreaPrimitive.Root
            data-slot="scroll-area"
            className={cn("relative", className)}
            {...props}
        >
            <ScrollAreaPrimitive.Viewport
                ref={viewportRef}
                data-slot="scroll-area-viewport"
                className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
            >
                {children}
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    );
}

function ScrollBar({
    className,
    orientation = "vertical",
    ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
    return (
        <ScrollAreaPrimitive.ScrollAreaScrollbar
            data-slot="scroll-area-scrollbar"
            orientation={orientation}
            className={cn(
                "flex touch-none transition-colors select-none",
                orientation === "vertical" && "h-full w-[8px] border-l border-l-transparent",
                orientation === "horizontal" && "h-[8px] flex-col border-t border-t-transparent",
                className
            )}
            {...props}
        >
            <ScrollAreaPrimitive.ScrollAreaThumb
                data-slot="scroll-area-thumb"
                className="bg-neutral-strong/70 relative flex-1 rounded-full"
            />
        </ScrollAreaPrimitive.ScrollAreaScrollbar>
    );
}

export { ScrollArea, ScrollBar };
