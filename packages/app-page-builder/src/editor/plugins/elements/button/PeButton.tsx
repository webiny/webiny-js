import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { Element } from "@webiny/app-page-builder-elements/types";
import { ButtonRenderer } from "@webiny/app-page-builder-elements/renderers/button";

interface PeButtonProps {
    element: PbEditorElement;
}

const PeButton: React.FC<PeButtonProps> = props => {
    const { element } = props;
    const { renderers } = usePageElements();

    const Button = renderers.button as ButtonRenderer;

    return <Button element={element as Element} />;
};

export default PeButton;
