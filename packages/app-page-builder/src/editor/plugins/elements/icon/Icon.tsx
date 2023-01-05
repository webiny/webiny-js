import React from "react";
import { PbEditorElement } from "~/types";
import PeIcon from "./PeIcon";
import PbIcon from "./PbIcon";
import { isLegacyRenderingEngine } from "~/utils";
import { Element } from "@webiny/app-page-builder-elements/types";

interface IconProps {
    element: PbEditorElement;
}

const Icon: React.FC<IconProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbIcon {...props} />;
    }

    const { element, ...rest } = props;
    return <PeIcon element={props.element as Element} {...rest} />;
};

export default Icon;
