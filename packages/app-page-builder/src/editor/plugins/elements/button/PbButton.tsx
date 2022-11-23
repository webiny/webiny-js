import React from "react";
import ButtonContainer from "./ButtonContainer";
import { ElementRoot } from "~/render/components/ElementRoot";
import { PbEditorElement } from "~/types";

interface ButtonProps {
    element: PbEditorElement;
}
const Button: React.FC<ButtonProps> = ({ element }) => {
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
