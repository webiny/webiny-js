import React, { CSSProperties } from "react";
import styled from "@emotion/styled";
import { PbEditorElement, DisplayMode } from "@webiny/app-page-builder/types";
import Element from "@webiny/app-page-builder/editor/components/Element";
import Carousel from "../../render/components/Carousel";

const StyledGrid = styled("div")({
    width: "100%"
});

type GridPropsType = {
    combineClassNames: (...classes: string[]) => string;
    elementStyle: CSSProperties;
    elementAttributes: { [key: string]: string };
    customClasses: string[];
    element: PbEditorElement;
    displayMode: DisplayMode;
};
const Grid: React.FunctionComponent<GridPropsType> = ({
    elementAttributes,
    customClasses,
    combineClassNames,
    element
}) => {
    return (
        <StyledGrid className={combineClassNames(...customClasses)} {...elementAttributes}>
            <Carousel>
                {element.elements.map((child: PbEditorElement) => {
                    return (
                        <div key={`carousel-item-${child.id}`}>
                            <Element id={child.id} />
                        </div>
                    );
                })}
            </Carousel>
        </StyledGrid>
    );
};
export default React.memo(Grid);
