import React from "react";
import { PbEditorElement } from "~/types";
import { isLegacyRenderingEngine } from "~/utils";
import PeAccordionItem from "./PeAccordionItem";
import { Element } from "@webiny/app-page-builder-elements/types";

interface AccordionItemProps {
    element: PbEditorElement;
}

const AccordionItem: React.FC<AccordionItemProps> = props => {
    if (isLegacyRenderingEngine) {
        return <></>;
    }

    const { element, ...rest } = props;
    return <PeAccordionItem element={element as Element} {...rest} />;
};

export default AccordionItem;
