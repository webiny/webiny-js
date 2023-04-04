import React from "react";
import Element from "~/render/components/Element";
import ElementAnimation from "~/render/components/ElementAnimation";
import { ElementRoot } from "~/render/components/ElementRoot";
import { PbElement } from "~/types";

interface AccordionItemPropsType {
    element: PbElement;
}
const AccordionItem: React.FC<AccordionItemPropsType> = ({ element }) => {
    return (
        <ElementAnimation>
            <ElementRoot
                element={element}
                className={"webiny-pb-base-page-element-style webiny-pb-layout-accordion-item"}
            >
                {element.elements.map((element, index) => (
                    <Element key={element.id || index} element={element} />
                ))}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default React.memo(AccordionItem);
