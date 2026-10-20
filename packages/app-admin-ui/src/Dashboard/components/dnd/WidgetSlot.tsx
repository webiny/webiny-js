import React from "react";

interface WidgetSlotProps {
    // The widget's container from `useWidgetHosts`.
    host: HTMLDivElement;
}

// Marks where a widget sits and moves the widget's container here. See `useWidgetHosts`.
export const WidgetSlot = ({ host }: WidgetSlotProps) => {
    return (
        <div
            ref={node => {
                if (node && host.parentNode !== node) {
                    node.appendChild(host);
                }
            }}
        />
    );
};
