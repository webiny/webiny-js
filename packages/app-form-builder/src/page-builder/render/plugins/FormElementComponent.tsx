import React from "react";
import { PbEditorElement } from "@webiny/app-page-builder/types";
import PeForm from "./PeFormElement";

import { Element } from "@webiny/app-page-builder-elements/types";

interface FormProps {
    element: PbEditorElement;
}

const FormElementComponent = (props: FormProps) => {
    const { element, ...rest } = props;
    return <PeForm element={element as Element} {...rest} />;
};

export default FormElementComponent;
