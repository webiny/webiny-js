import { useEffect, useState } from "react";
import { viewportManager } from "@webiny/app-website-builder/sdk";

export const useViewport = () => {
    const [viewport, setViewport] = useState(viewportManager.getViewport());

    useEffect(() => {
        return viewportManager.onViewportChangeEnd(setViewport);
    }, []);

    return viewport;
};
