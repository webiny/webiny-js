import React from "react";
import { createPortal } from "react-dom";
import { WidgetSlot } from "../dnd/WidgetSlot.js";
import { useWidgetHosts } from "../dnd/useWidgetHosts.js";

/*
 * Renders every placed widget once, into its own container, and returns a slot per widget for the
 * layouts to place. Moving a slot moves the widget without remounting it; see `useWidgetHosts`.
 * Render `portals` once, anywhere stable; render `slots.get(name)` wherever the widget goes.
 */
export const useWidgetPortals = (placed: string[], elements: Map<string, React.ReactElement>) => {
    const getHost = useWidgetHosts();
    const slots = new Map<string, React.ReactElement>();
    const portals: React.ReactNode[] = [];

    for (const name of placed) {
        const element = elements.get(name);
        if (!element) {
            continue;
        }
        const host = getHost(name);
        slots.set(name, <WidgetSlot host={host} />);
        const portal = createPortal(element, host, name);
        portals.push(portal);
    }

    return { slots, portals };
};
