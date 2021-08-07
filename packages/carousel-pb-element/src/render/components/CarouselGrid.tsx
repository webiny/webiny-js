import React from "react";
import classNames from "classnames";
import Element from "@webiny/app-page-builder/render/components/Element";
import ElementAnimation from "@webiny/app-page-builder/render/components/ElementAnimation";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement } from "@webiny/app-page-builder/types";
import Carousel from "~/render/components/Carousel";

type GridPropsType = {
    element: PbElement;
};
const Grid: React.FunctionComponent<GridPropsType> = ({ element }) => {
    return (
        <ElementAnimation>
            <ElementRoot
                element={element}
                className={classNames("webiny-pb-base-page-element-style")}
            >
                <Carousel>
                    {element.elements.map(element => (
                        <Element key={element.id} element={element} />
                    ))}
                </Carousel>
            </ElementRoot>
        </ElementAnimation>
    );
};

export default React.memo(Grid);
