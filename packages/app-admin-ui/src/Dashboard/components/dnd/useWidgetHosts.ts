import { useCallback } from "react";
import { useRef } from "react";

/*
 * One detached container per widget, created once and kept for the life of the dashboard.
 *
 * Each widget renders into its container through a portal, and `WidgetSlot` moves the container
 * to wherever the widget currently sits. The portal's container never changes, so React never
 * remounts the widget: switching Customize mode or dropping a widget into another column doesn't
 * reload it.
 */
export const useWidgetHosts = () => {
    const hosts = useRef(new Map<string, HTMLDivElement>());

    return useCallback((name: string): HTMLDivElement => {
        let host = hosts.current.get(name);
        if (!host) {
            host = document.createElement("div");
            host.dataset.widgetHost = name;
            hosts.current.set(name, host);
        }
        return host;
    }, []);
};
