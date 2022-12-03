import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import {
    IconComponent,
} from "@webiny/app-page-builder-elements/renderers/icon";

interface PeIconProps {
    isActive?: boolean;
    element: PbEditorElement;
}

const PeIcon: React.FC<PeIconProps> = props => {
    const { element } = props;
    const { renderers } = usePageElements();

    const Icon = renderers.icon as IconComponent;

    return <Icon element={element} />;
};

export default PeIcon;
