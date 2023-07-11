import { PbRenderElementPlugin } from "~/types";
import { createTabs } from "@webiny/app-page-builder-elements/renderers/tabs";

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-tabs",
        elementType: "tabs",
        render: createTabs()
    };
};
