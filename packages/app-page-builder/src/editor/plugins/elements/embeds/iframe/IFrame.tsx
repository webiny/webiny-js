import React from "react";
import { PbEditorElement } from "~/types";
import PeIframe from "./PeIFrame";

import { Element } from "@webiny/app-page-builder-elements/types";

interface IframeProps {
    element: PbEditorElement;
}

const Iframe = (props: IframeProps) => {
    const { element, ...rest } = props;
    return <PeIframe element={element as Element} {...rest} />;
};

export default Iframe;
