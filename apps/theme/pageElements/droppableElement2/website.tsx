import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";
import { DroppableElement2 } from "./DroppableElement2";

const plugin = {
    name: "pb-render-page-element-droppable-element-2",
    type: "pb-render-page-element",
    elementType: "droppableElement2",
    render: DroppableElement2
} as PbRenderElementPlugin;

export default plugin;