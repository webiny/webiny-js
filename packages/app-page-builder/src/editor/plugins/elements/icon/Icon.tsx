import React from "react";
import { PbEditorElement } from "~/types";
import PeIcon from "./PeIcon";

import { Element } from "@webiny/app-page-builder-elements/types";

interface IconProps {
    element: PbEditorElement;
}

const Icon: React.FC<IconProps> = props => {
    const { element, ...rest } = props;
    return <PeIcon element={element as Element} {...rest} />;
};

export default Icon;
