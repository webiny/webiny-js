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

interface ScrollAreaProps extends Omit<
    React.ComponentProps<typeof ScrollAreaPrimitive.Root>,
    "onScroll"
> {
    onScrollPositionChange?: (position: ScrollPosition) => void;
    onScroll?: (position: ScrollPosition) => void;
    /**
     * Classes for the scrolling element itself. Put the height limit here when the area has to grow
     * with its content up to a maximum, instead of filling a parent of a known height.
     */
    viewportClassName?: string;
}

function ScrollArea({
    className,
    children,
    onScrollPositionChange,
    onScroll,
    viewportClassName,
    // Radix would only show the scrollbar once the pointer is inside. Showing it whenever there is
    // more content is the same rule the rest of the admin follows, a Select included.
    type = "auto",
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
            type={type}
            className={cn("relative", className)}
            {...props}
        >
            <ScrollAreaPrimitive.Viewport
                ref={viewportRef}
                data-slot="scroll-area-viewport"
                className={cn(
                    "focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
                    viewportClassName
                )}
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
    onMouseDown,
    ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        onMouseDown?.(event);

        // Grabbing a scrollbar must not move focus. An autocomplete closes its list the moment its
        // input blurs, so without this, dragging the thumb dismisses the list under the pointer.
        event.preventDefault();
    };

    return (
        <ScrollAreaPrimitive.ScrollAreaScrollbar
            data-slot="scroll-area-scrollbar"
            orientation={orientation}
            onMouseDown={handleMouseDown}
            className={cn(
                "flex touch-none transition-colors select-none",
                orientation === "vertical" && "h-full w-[10px] p-[2px]",
                orientation === "horizontal" && "h-[10px] flex-col p-[2px]",
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
