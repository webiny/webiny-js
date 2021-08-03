import Element from "../../../components/Element";
import ElementAnimation from "../../../components/ElementAnimation";
import { ElementRoot } from "../../../components/ElementRoot";
import { PbElement } from "~/types";
import React from "react";
import classNames from "classnames";
import dotProp from "dot-prop-immutable";

type GridPropsType = {
    element: PbElement;
};
const Grid: React.FunctionComponent<GridPropsType> = ({ element }) => {
    return (
        <ElementAnimation>
            <ElementRoot
                element={element}
                className={classNames(
                    "webiny-pb-base-page-element-style",
                    "webiny-pb-layout-grid",
                    {
                        "webiny-pb-layout-grid--reverse": dotProp.get(
                            element,
                            "data.settings.grid.reverse"
                        )
                    }
                )}
            >
                {element.elements.map(element => (
                    <Element key={element.id} element={element} />
                ))}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default React.memo(Grid);
