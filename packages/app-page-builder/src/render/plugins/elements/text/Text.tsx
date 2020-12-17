import React from "react";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement } from "@webiny/app-page-builder/types";
import { plugins } from "@webiny/plugins";

type TextPropsType = {
    element: PbElement;
};
const Text: React.FunctionComponent<TextPropsType> = ({ element }) => {
    const [rendererPlugin] = plugins
        .byType("rte-data-renderer")
        .filter(pl => pl.outputType === "jsx");

    return (
        <ElementRoot element={element} className={className}>
            {rendererPlugin.render(element.data.text)}
        </ElementRoot>
    );
};

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

export default Text;
