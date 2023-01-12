import Block from "./Block";
import { PbRenderElementPlugin } from "~/types";
import { createBlock } from "@webiny/app-page-builder-elements/renderers/block";
import { isLegacyRenderingEngine } from "~/utils";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine ? Block : createBlock();

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-block",
        type: "pb-render-page-element",
        elementType: "block",
        render
    };
};
