import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";

import { IFrame } from "./../components/iFrame";

export default () => {
    // @ts-ignore
    return {
        name: "pb-render-page-element-iframe",
        type: "pb-render-page-element",
        elementType: "iframe",
        renderer: IFrame
    } as PbRenderElementPlugin;
};
