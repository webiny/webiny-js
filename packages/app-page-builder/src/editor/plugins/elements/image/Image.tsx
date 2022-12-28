import React from "react";
import { PbEditorElement } from "~/types";
import PeImage from "./PeImage";
import PbImage from "./PbImage";

interface ImageProps {
    element: PbEditorElement;
}

const Image: React.FC<ImageProps> = props => {
    if (process.env.REACT_APP_PB_ELEMENTS_LEGACY_RENDERING_ENGINE === "true") {
        return <PbImage {...props} />;
    }
    return <PeImage {...props} />;
};

export default React.memo(Image);
