import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";

// Used when the dragged card couldn't be measured.
const FALLBACK_HEIGHT = 80;

interface WidgetDropIndicatorProps {
    // The dragged widget's title, shown in the slot.
    title: string;
    // The dragged card's height, so the slot reserves exactly the space the widget will take.
    height: number;
}

/**
 * The slot a dragged widget would drop into: an empty card the size of the dragged one, titled
 * like it. It grows from nothing when it appears, so the cards below slide instead of jump.
 */
export const WidgetDropIndicator = ({ title, height }: WidgetDropIndicatorProps) => {
    const [grown, setGrown] = useState(false);

    useEffect(() => {
        // One frame at zero height first, so the browser has something to transition from.
        const frame = requestAnimationFrame(() => setGrown(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    let targetHeight = FALLBACK_HEIGHT;
    if (height > 0) {
        targetHeight = height;
    }

    return (
        <div
            aria-hidden
            data-testid={"dashboard-widget-drop-indicator"}
            className={cn(
                "pointer-events-none w-full flex-none overflow-hidden",
                // `rounded-xl` and the 2px border match the cards' outline in Customize mode.
                "rounded-xl border-2 border-dashed",
                "motion-safe:transition-[height] motion-safe:duration-200 motion-safe:ease-out"
            )}
            style={{
                height: grown ? targetHeight : 0,
                borderColor: "var(--color-primary-400)",
                backgroundColor: "color-mix(in srgb, var(--color-primary-500) 6%, transparent)"
            }}
        >
            {/* Where the card's own title sits, and out of the way of the drag chip under the pointer. */}
            <Text
                as={"div"}
                size={"md"}
                className={"px-lg pt-md-plus font-semibold text-accent-primary"}
            >
                {title}
            </Text>
        </div>
    );
};
