import React from "react";

/**
 * Insertion indicator shown while dragging a widget: an orange dashed border with a
 * translucent orange body, rendered at the slot where the widget would drop.
 */
export const WidgetDropIndicator = () => {
    return (
        <div
            data-testid={"dashboard-widget-drop-indicator"}
            className={"pointer-events-none h-20 w-full rounded-md border-2 border-dashed"}
            style={{
                borderColor: "var(--color-primary-500)",
                backgroundColor: "color-mix(in srgb, var(--color-primary-500) 12%, transparent)"
            }}
        />
    );
};
