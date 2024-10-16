import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";
import { SpaceX } from "./spaceX/SpaceX";

export const Extension = () => {
    return [
        {
            name: "pb-render-page-element-space-x",
            type: "pb-render-page-element",
            elementType: "spaceX",
            render: SpaceX
        } as PbRenderElementPlugin
    ];
};
