import { PbRenderElementPlugin } from "~/types";
import { createCodesandbox } from "@webiny/app-page-builder-elements/renderers/embeds/codesandbox";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-codesandbox",
        type: "pb-render-page-element",
        elementType: "codesandbox",
        render: createCodesandbox()
    };
};
