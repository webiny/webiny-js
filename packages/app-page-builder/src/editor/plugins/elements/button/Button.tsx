import React from "react";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { PeEditorTextElementProps } from "~/types";

import PeButton from "./PeButton";
import PbButton from "./PbButton";

const Button: React.FC<PeEditorTextElementProps> = props => {
    const pageElements = usePageElements();

    if (pageElements) {
        return <PeButton {...props} />;
    }

    return <PbButton {...props} />;
};

export default Button;
