// @flow
import React from "react";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import ButtonContainer from "./ButtonContainer";

const Button = ({ element }: Object) => {
    return (
        <ElementRoot className={"webiny-pb-base-page-element-style"} element={element}>
            {({ getAllClasses, elementStyle, elementAttributes }) => (
                <ButtonContainer
                    elementId={element.id}
                    getAllClasses={getAllClasses}
                    elementStyle={elementStyle}
                    elementAttributes={elementAttributes}
                />
            )}
        </ElementRoot>
    );
};

export default Button;
