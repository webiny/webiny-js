import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";
import { contentGallery } from "./contentGallery";

const plugin = {
    name: "pb-render-page-element-content-gallery",
    type: "pb-render-page-element",
    elementType: "contentGallery",
    render: contentGallery
} as PbRenderElementPlugin;

export default plugin;