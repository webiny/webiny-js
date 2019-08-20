//@flow
import React from "react";
import styled from "react-emotion";
import { ElementRoot } from "webiny-app-page-builder/render/components/ElementRoot";
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
            <ElementRoot element={element}>
                {({ elementStyle, customClasses, combineClassNames }) => (
                    <SpacerContainer
                        elementId={element.id}
                        elementStyle={elementStyle}
                        customClasses={customClasses}
                        combineClassNames={combineClassNames}
                    />
                )}
            </ElementRoot>
        </SpacerElement>
    );
};

export default Spacer;
