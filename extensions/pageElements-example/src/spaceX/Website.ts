import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";
import { SpaceX } from "./SpaceX";

const plugin = {
    name: "pb-render-page-element-space-x",
    type: "pb-render-page-element",
    elementType: "spaceX",
    render: SpaceX
} as PbRenderElementPlugin;

import { plugins } from "@webiny/plugins";
import { useEffect } from "react";

export const Website = () => {
    useEffect(() => {
        plugins.register(plugin);
    }, []);

    return null;
};
