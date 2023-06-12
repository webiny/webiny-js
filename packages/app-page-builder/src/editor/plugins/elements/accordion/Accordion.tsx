import React from "react";
import { PbEditorElement } from "~/types";
import { isLegacyRenderingEngine } from "~/utils";
import PeAccordion from "./PeAccordion";
import { Element } from "@webiny/app-page-builder-elements/types";

interface AccordionProps {
    element: PbEditorElement;
}

const Accordion: React.FC<AccordionProps> = props => {
    if (isLegacyRenderingEngine) {
        return <></>;
    }

    const { element, ...rest } = props;
    return <PeAccordion element={element as Element} {...rest} />;
};

export default Accordion;
