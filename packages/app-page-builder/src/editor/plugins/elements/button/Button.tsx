import React from "react";
import { PbEditorElement } from "~/types";
import PeButton from "./PeButton";

import { Element } from "@webiny/app-page-builder-elements/types";

interface ButtonProps {
    element: PbEditorElement;
}

const Button = (props: ButtonProps) => {
    const { element, ...rest } = props;
    return <PeButton element={element as Element} {...rest} />;
};

export default Button;
