import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { IconRenderer } from "@webiny/app-page-builder-elements/renderers/icon";
import { Element } from "@webiny/app-page-builder-elements/types";

interface PeIconProps {
    isActive?: boolean;
    element: PbEditorElement;
}

const PeIcon: React.FC<PeIconProps> = props => {
    const { element } = props;
    const { renderers } = usePageElements();

    const Icon = renderers.icon as IconRenderer;

    return <Icon element={element as Element} />;
};

export default PeIcon;
