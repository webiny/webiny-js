import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import PeIcon from "./PeIcon";
import PbIcon from "./PbIcon";

interface IconProps {
    element: PbEditorElement;
}

const Icon: React.FC<IconProps> = props => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PeIcon {...props} />;
    }
    return <PbIcon {...props} />;
};

export default React.memo(Icon);
