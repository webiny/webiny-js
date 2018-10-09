//@flow
import React from "react";
import { connect } from "react-redux";
import { css } from "emotion";
import styled from "react-emotion";
import { set } from "dot-prop-immutable";
import { updateElement } from "webiny-app-cms/editor/actions";
import { resizeStart, resizeStop } from "./actions";
import Resizer from "webiny-app-cms/editor/components/Resizer";
import ElementStyle from "webiny-app-cms/render/components/ElementStyle";

export const MIN_HEIGHT = 20;
export const INIT_HEIGHT = 100;

const SpacerElement = styled("div")({
    position: "relative",
    width: "100%",
    border: "2px dotted var(--mdc-theme-secondary)",
    textAlign: "center",
    opacity: 0,
    cursor: "ns-resize",
    transition: "opacity 0.2s",
    backgroundColor: "var(--mdc-theme-secondary)",
    minHeight: MIN_HEIGHT,
    "&:hover": {
        opacity: 1
    }
});

const SpacerHandle = styled("div")({
    height: "100%",
    width: "100%",
    position: "absolute",
    left: 0,
    bottom: -8
});

const SpacerHeight = styled("div")({
    position: "absolute",
    width: 50,
    top: "calc(50% - 12px)",
    left: "calc(50% - 25px)",
    color: "white",
    fontSize: 12,
    padding: 5,
    borderRadius: 5
});

const Spacer = props => {
    const { element, resizeStart, resizeStop, updateElement } = props;

    return (
        <SpacerElement>
            <ElementStyle element={element}>
                {({ elementStyle, inlineStyle, customClasses, combineClassNames }) => {
                    const { height = INIT_HEIGHT, ...spacerStyle } = elementStyle;

                    return (
                        <div
                            style={{ height }}
                            className={combineClassNames(
                                css(spacerStyle),
                                inlineStyle,
                                ...customClasses
                            )}
                        >
                            <Resizer
                                axis={"y"}
                                onResizeStart={() => resizeStart()}
                                onResizeStop={() => {
                                    resizeStop();
                                    updateElement({ element });
                                }}
                                onResize={diff => {
                                    updateElement({
                                        element: set(
                                            element,
                                            "settings.style.height",
                                            Math.max(MIN_HEIGHT, height - diff)
                                        ),
                                        history: false
                                    });
                                }}
                            >
                                {({ ...otherProps }) => (
                                    <React.Fragment>
                                        <SpacerHeight>
                                            {height}
                                            px
                                        </SpacerHeight>

                                        <SpacerHandle {...otherProps} />
                                    </React.Fragment>
                                )}
                            </Resizer>
                        </div>
                    );
                }}
            </ElementStyle>
        </SpacerElement>
    );
};

export default connect(
    null,
    { updateElement, resizeStart, resizeStop }
)(Spacer);
