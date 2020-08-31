import * as React from "react";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import ImageContainer from "./ImageContainer";

const Image = ({ element }) => {
    console.log("editor element");
    console.log(element);
    return (
        <ElementRoot
            element={element}
            className={"webiny-pb-base-page-element-style webiny-pb-page-element-image"}
        >
            <ImageContainer elementId={element.id} />
        </ElementRoot>
    );
};

export default Image;
