import React from "react";
import ImageContainer from "./ImageContainer";
import { PbEditorElement } from "../../../../types";
import { ElementRoot } from "../../../../render/components/ElementRoot";

type ImagePropsType = {
    element: PbEditorElement;
};
const Image: React.FC<ImagePropsType> = ({ element }) => {
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
