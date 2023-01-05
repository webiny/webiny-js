import React from "react";
import { PbEditorElement } from "~/types";
import PeIframe from "./PeIFrame";
import PbIframe from "./PbIFrame";
import { isLegacyRenderingEngine } from "~/utils";
import { Element } from "@webiny/app-page-builder-elements/types";

interface IframeProps {
    element: PbEditorElement;
}

const Iframe: React.FC<IframeProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbIframe {...props} />;
    }

    const { element, ...rest } = props;
    return <PeIframe element={props.element as Element} {...rest} />;
};

export default Iframe;
