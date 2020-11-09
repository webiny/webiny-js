import { elementWithChildrenByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import React from "react";
import ElementAnimation from "@webiny/app-page-builder/render/components/ElementAnimation";
import Grid from "./Grid";
import styled from "@emotion/styled";
import { useRecoilValue } from "recoil";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement, PbShallowElement } from "@webiny/app-page-builder/types";

const GridContainerStyle = styled("div")({
    position: "relative",
    color: "#666",
    padding: 5,
    boxSizing: "border-box"
});

type GridContainerPropsType = {
    element: PbShallowElement | PbElement;
};
const GridContainer: React.FunctionComponent<GridContainerPropsType> = ({ element: { id } }) => {
    const element = useRecoilValue(elementWithChildrenByIdSelector(id));
    return (
        <GridContainerStyle id={id}>
            <ElementAnimation>
                <ElementRoot element={element}>
                    {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => (
                        <Grid
                            element={element}
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
        </GridContainerStyle>
    );
};

export default React.memo(GridContainer, (current, next) => {
    return current.element.id === next.element.id;
});
