import React from "react";
import { PbEditorElement } from "~/types";
import PeButton from "./PeButton";
import PbButton from "./PbButton";
import { isLegacyRenderingEngine } from "~/utils";

interface ButtonProps {
    element: PbEditorElement;
}

const Button: React.FC<ButtonProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbButton {...props} />;
    }
    return <PeButton {...props} />;
};

export default Button;
