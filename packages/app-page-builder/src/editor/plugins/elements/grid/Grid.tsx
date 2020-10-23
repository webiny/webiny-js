import React from "react";
import styled from "@emotion/styled";
import GridContainer from "./GridContainer";
import ElementAnimation from "@webiny/app-page-builder/render/components/ElementAnimation";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement, PbShallowElement } from "@webiny/app-page-builder/types";

const GridStyle = styled("div")({
    position: "relative",
    color: "#666",
    padding: 5,
    boxSizing: "border-box"
});

type GridBlockPropsType = {
    element: PbElement;
};
export const Grid: React.FunctionComponent<GridBlockPropsType> = ({ element }) => {
    const { id } = element;
    return (
        <GridStyle id={id}>
            <ElementAnimation>
                <ElementRoot element={element}>
                    {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => (
                        <GridContainer
                            element={(element as unknown) as PbShallowElement}
                            elementStyle={elementStyle}
                            elementAttributes={elementAttributes}
                            customClasses={[
                                "webiny-pb-layout-grid webiny-pb-base-page-element-style",
                                ...customClasses
                            ]}
                            combineClassNames={combineClassNames}
                        />
                    )}
                </ElementRoot>
            </ElementAnimation>
        </GridStyle>
    );
};

export default React.memo(Grid, (current, next) => {
    return current.element.id === next.element.id;
});
