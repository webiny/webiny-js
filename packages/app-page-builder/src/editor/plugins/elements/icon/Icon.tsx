import React from "react";
import { PbEditorElement } from "~/types";
import PeIcon from "./PeIcon";
import PbIcon from "./PbIcon";
import { isLegacyRenderingEngine } from "~/utils";

interface IconProps {
    element: PbEditorElement;
}

const Icon: React.FC<IconProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbIcon {...props} />;
    }
    return <PeIcon {...props} />;
};

export default Icon;
