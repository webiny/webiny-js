// @flow
import React from "react";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";
import ButtonContainer from "./ButtonContainer";

const Button = ({ element }: Object) => {
    return (
        <ElementStyle {...getElementStyleProps(element)}>
            {({ getAllClasses }) => (
                <ButtonContainer elementId={element.id} getAllClasses={getAllClasses} />
            )}
        </ElementStyle>
    );
};

export default Button;
