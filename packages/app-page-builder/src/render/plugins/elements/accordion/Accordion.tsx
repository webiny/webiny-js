import React from "react";
import Element from "~/render/components/Element";
import ElementAnimation from "~/render/components/ElementAnimation";
import { ElementRoot } from "~/render/components/ElementRoot";
import { PbElement } from "~/types";

interface AccordionPropsType {
    element: PbElement;
}
const Accordion: React.FC<AccordionPropsType> = ({ element }) => {
    return (
        <ElementAnimation>
            <ElementRoot
                element={element}
                className={"webiny-pb-base-page-element-style webiny-pb-layout-accordion"}
            >
                {element.elements.map((element, index) => (
                    <Element key={element.id || index} element={element} />
                ))}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default React.memo(Accordion);
