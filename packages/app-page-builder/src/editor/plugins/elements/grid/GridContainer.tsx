import React from "react";
import { useRecoilValue } from "recoil";
import kebabCase from "lodash/kebabCase";
import styled from "@emotion/styled";
import { PbElement, PbShallowElement } from "../../../../types";
import { elementWithChildrenByIdSelector, uiAtom } from "../../../recoil/modules";
import ElementAnimation from "../../../../render/components/ElementAnimation";
import { ElementRoot } from "../../../../render/components/ElementRoot";
import Grid from "./Grid";

const GridContainerStyle = styled("div")({
    position: "relative",
    color: "#666",
    padding: 5,
    boxSizing: "border-box",
    display: "flex"
});

type GridContainerPropsType = {
    element: PbShallowElement | PbElement;
};
const GridContainer: React.FunctionComponent<GridContainerPropsType> = ({ element: { id } }) => {
    const element = useRecoilValue(elementWithChildrenByIdSelector(id));
    const { editorMode } = useRecoilValue(uiAtom);
    // TODO remove when state is fully switched to use content instead of flat elements
    if (!element) {
        return null;
    }
    return (
        <ElementAnimation>
            <ElementRoot element={element}>
                {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => {
                    // Use per-device style
                    const justifyContent =
                        elementStyle[`--${kebabCase(editorMode)}-justify-content`];

                    return (
                        <GridContainerStyle id={id} style={{ justifyContent }}>
                            <Grid
                                element={element}
                                elementStyle={elementStyle}
                                elementAttributes={elementAttributes}
                                customClasses={[
                                    "webiny-pb-layout-grid webiny-pb-base-page-element-style",
                                    ...customClasses
                                ]}
                                combineClassNames={combineClassNames}
                                editorMode={editorMode}
                            />
                        </GridContainerStyle>
                    );
                }}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default React.memo(GridContainer, (current, next) => {
    return current.element.id === next.element.id;
});
