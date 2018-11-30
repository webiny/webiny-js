//@flow
import React from "react";
import styled from "react-emotion";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";
import SpacerContainer from "./SpacerContainer";
export { MIN_HEIGHT, INIT_HEIGHT } from "./SpacerContainer";

const SpacerElement = styled("div")({
    position: "relative",
    width: "100%",
    border: "2px dotted var(--mdc-theme-secondary)",
    textAlign: "center",
    opacity: 0,
    cursor: "ns-resize",
    transition: "opacity 0.2s",
    backgroundColor: "var(--mdc-theme-secondary)",
    minHeight: 20,
    "&:hover": {
        opacity: 1
    }
});

const Spacer = ({ element }: Object) => {
    return (
        <SpacerElement>
            <ElementStyle {...getElementStyleProps(element)}>
                {({ elementStyle, customClasses, combineClassNames }) => (
                    <SpacerContainer
                        elementId={element.id}
                        elementStyle={elementStyle}
                        customClasses={customClasses}
                        combineClassNames={combineClassNames}
                    />
                )}
            </ElementStyle>
        </SpacerElement>
    );
};

export default Spacer;
