import React from "react";
import { useRecoilValue } from "recoil";
import styled from "@emotion/styled";
import { PbEditorElement } from "@webiny/app-page-builder/types";
import {
    elementWithChildrenByIdSelector,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import ElementAnimation from "@webiny/app-page-builder/render/components/ElementAnimation";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import CarouselGrid from "./CarouselGrid";

const GridContainerStyle = styled("div")({
    position: "relative",
    color: "#666",
    padding: 5,
    boxSizing: "border-box"
});

type GridContainerPropsType = {
    element: PbEditorElement;
};
const GridContainer: React.FunctionComponent<GridContainerPropsType> = ({ element: { id } }) => {
    const element = useRecoilValue(elementWithChildrenByIdSelector(id));
    const { displayMode } = useRecoilValue(uiAtom);
    // TODO remove when state is fully switched to use content instead of flat elements
    if (!element) {
        return null;
    }
    return (
        <ElementAnimation>
            <ElementRoot element={element}>
                {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => {
                    return (
                        <GridContainerStyle id={id}>
                            <CarouselGrid
                                element={element}
                                elementStyle={elementStyle}
                                elementAttributes={elementAttributes}
                                customClasses={[
                                    "webiny-pb-layout-carousel-grid webiny-pb-base-page-element-style",
                                    ...customClasses
                                ]}
                                combineClassNames={combineClassNames}
                                displayMode={displayMode}
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
