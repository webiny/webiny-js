import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import PeButton from "./PeButton";
import PbButton from "./PbButton";

interface ButtonProps {
    element: PbEditorElement;
}

const Button: React.FC<ButtonProps> = props => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PeButton {...props} />;
    }
    return <PbButton {...props} />;
};

export default React.memo(Button);
