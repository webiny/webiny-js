import React from "react";
import { PbEditorElement } from "~/types";

import PeAccordionItem from "./PeAccordionItem";
import { Element } from "@webiny/app-page-builder-elements/types";

interface AccordionItemProps {
    element: PbEditorElement;
}

const AccordionItem = (props: AccordionItemProps) => {
    const { element, ...rest } = props;
    return <PeAccordionItem element={element as Element} {...rest} />;
};

export default AccordionItem;
