// @flow
import * as React from "react";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";
import ImageContainer from "./ImageContainer";

const Image = ({ element }: Object) => {
    return (
        <ElementRoot
            element={element}
            className={"webiny-cms-base-element-style webiny-cms-element-image"}
        >
            <ImageContainer elementId={element.id}/>
        </ElementRoot>
    );
};


export default Image;