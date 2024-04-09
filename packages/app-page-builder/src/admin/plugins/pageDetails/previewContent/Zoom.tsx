import * as React from "react";
import store from "store";
import { useEffect, useState } from "react";

const LOCAL_STORAGE_KEY = "webiny_pb_page_zoom";

interface ZoomProps {
    children(params: { zoom: number; setZoom(zoom: number): void }): JSX.Element;
}

const getZoomLevel = (): number => {
    const zoom = store.get(LOCAL_STORAGE_KEY) as number;
    if (!zoom) {
        switch (true) {
            case window.innerWidth < 1600:
                return 0.75;
            case window.innerWidth < 1200:
                return 0.5;
            default:
                return 1;
        }
    }

    return zoom;
};

export const Zoom = ({ children }: ZoomProps) => {
    const [zoom, setZoom] = useState(() => getZoomLevel());

    useEffect(() => {
        // Whenever zoom changes, store it to localStorage.
        store.set(LOCAL_STORAGE_KEY, zoom);
    }, [zoom]);

    return <>{children({ zoom, setZoom })}</>;
};
