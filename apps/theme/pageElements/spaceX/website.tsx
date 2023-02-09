import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";
import { SpaceX } from "./SpaceX";

const plugin = {
    name: "pb-render-page-element-space-x",
    type: "pb-render-page-element",
    elementType: "spaceX",
    render: SpaceX
} as PbRenderElementPlugin;

export default plugin;
