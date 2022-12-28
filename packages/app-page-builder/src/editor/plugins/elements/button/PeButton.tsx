import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { Element } from "@webiny/app-page-builder-elements/types";
import {
    ButtonElementData,
    ButtonRenderer
} from "@webiny/app-page-builder-elements/renderers/button";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";

interface PeButtonProps {
    element: PbEditorElement;
}

const PeButton: React.FC<PeButtonProps> = props => {
    const { element } = props;
    const { renderers } = usePageElements();
    const variableValue = useElementVariableValue(element);

    const Button = renderers.button as ButtonRenderer;

    let buttonText: string | undefined, action: ButtonElementData["action"] | undefined;
    if (variableValue) {
        buttonText = variableValue.label;
        action = {
            actionType: "link",
            newTab: false,
            href: variableValue.url
        };
    }

    return <Button element={element as Element} buttonText={buttonText} action={action} />;
};
export default PeButton;
