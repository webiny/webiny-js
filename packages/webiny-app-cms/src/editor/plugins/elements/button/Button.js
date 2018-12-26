// @flow
import React from "react";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";
import ButtonContainer from "./ButtonContainer";

const Button = ({ element }: Object) => {
    return (
        <ElementStyle
            className={"webiny-cms-base-element-style"}
            {...getElementStyleProps(element)}
        >
            {({ getAllClasses, elementStyle, elementAttributes }) => (
                <ButtonContainer
                    elementId={element.id}
                    getAllClasses={getAllClasses}
                    elementStyle={elementStyle}
                    elementAttributes={elementAttributes}
                />
            )}
        </ElementStyle>
    );
};

export default Button;
