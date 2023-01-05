import React from "react";
import { PbEditorElement } from "~/types";
import PeImage from "./PeImage";
import PbImage from "./PbImage";
import { Element } from "@webiny/app-page-builder-elements/types";
import { isLegacyRenderingEngine } from "~/utils";

interface ImageProps {
    element: PbEditorElement;
}

const Image: React.FC<ImageProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbImage {...props} />;
    }
    return <PeImage element={props.element as Element} />;
};

export default React.memo(Image);
