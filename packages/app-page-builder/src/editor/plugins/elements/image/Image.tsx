import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import PeImage from "./PeImage";
import PbImage from "./PbImage";

interface ImageProps {
    element: PbEditorElement;
}

const Image: React.FC<ImageProps> = props => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PeImage {...props} />;
    }
    return <PbImage {...props} />;
};

export default React.memo(Image);
