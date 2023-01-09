import React from "react";
import { PbEditorElement } from "@webiny/app-page-builder/types";
import PbForm from "./PbFormElement";
import PeForm from "./PeFormElement";
import { isLegacyRenderingEngine } from "~/utils";
import { Element } from "@webiny/app-page-builder-elements/types";

interface FormProps {
    element: PbEditorElement;
    isActive: boolean;
}

const FormElementComponent: React.FC<FormProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbForm {...props} />;
    }

    const { element, ...rest } = props;
    return <PeForm element={element as Element} {...rest} />;
};

export default FormElementComponent;

