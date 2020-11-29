import React from "react";
import ImageContainer from "./ImageContainer";
import { PbElement } from "@webiny/app-page-builder/types";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";

type ImagePropsType = {
    element: PbElement;
};
const Image: React.FunctionComponent<ImagePropsType> = ({ element }) => {
    return (
        <ElementRoot
            element={element}
            className={"webiny-pb-base-page-element-style webiny-pb-page-element-image"}
        >
            <ImageContainer element={element} />
        </ElementRoot>
    );
};

export default Image;
