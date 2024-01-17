import React from "react";
import { createIcon } from "@webiny/app-page-builder-elements/renderers/icon";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";

const Icon = createIcon();

interface Props {
    element: Element;
}

const PeIcon = (props: Props) => {
    const { element } = props;
    const variableValue = useElementVariableValue(element);

    if (variableValue?.markup) {
        return <Icon {...props} markup={variableValue.markup} />;
    }

    return <Icon {...props} />;
};

export default PeIcon;
