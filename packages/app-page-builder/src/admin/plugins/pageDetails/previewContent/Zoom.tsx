import * as React from "react";
import { useEffect, useState } from "react";
import { useLocalStorage } from "@webiny/app";
import type { ILocalStorage } from "@webiny/app/localStorage/feature/abstractions.js";

const LOCAL_STORAGE_KEY = "pb_page_zoom";

interface ZoomProps {
    children(params: { zoom: number; setZoom(zoom: number): void }): JSX.Element;
}

const getZoomLevel = (localStorage: ILocalStorage): number => {
    const zoom = localStorage.get<number>(LOCAL_STORAGE_KEY);
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
    const { localStorage } = useLocalStorage();
    const [zoom, setZoom] = useState(() => getZoomLevel(localStorage));

    useEffect(() => {
        // Whenever zoom changes, store it to localStorage.
        localStorage.set(LOCAL_STORAGE_KEY, zoom);
    }, [zoom]);

    return <>{children({ zoom, setZoom })}</>;
};
