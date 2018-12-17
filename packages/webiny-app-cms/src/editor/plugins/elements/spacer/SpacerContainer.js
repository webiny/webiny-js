// @flow
import * as React from "react";
import { compose, withHandlers, withState } from "recompose";
import { css } from "emotion";
import styled from "react-emotion";
import { connect } from "webiny-app-cms/editor/redux";
import { set } from "dot-prop-immutable";
import { get } from "lodash";
import Resizer from "webiny-app-cms/editor/components/Resizer";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getElement } from "webiny-app-cms/editor/selectors";
import { resizeStart, resizeStop } from "./actions";

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

export const MIN_HEIGHT = 20;
export const INIT_HEIGHT = 100;

const SpacerContainer = ({
    localHeight,
    onResizeStart,
    onResizeStop,
    onResize,
    elementStyle,
    customClasses,
    combineClassNames
}) => {
    let { height = MIN_HEIGHT, ...spacerStyle } = elementStyle;
    if (localHeight) {
        height = localHeight;
    }

    return (
        <div style={{ height }} className={combineClassNames(css(spacerStyle), ...customClasses)}>
            <Resizer
                axis={"y"}
                onResizeStart={onResizeStart}
                onResizeStop={onResizeStop}
                onResize={onResize}
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
};

export default compose(
    connect(
        (state, props) => ({ element: getElement(state, props.elementId) }),
        { updateElement, resizeStart, resizeStop }
    ),
    withState("localHeight", "setHeight", null),
    withHandlers({
        onResizeStart: ({ element, setHeight, resizeStart }) => () => {
            resizeStart();
            setHeight(get(element, "settings.style.height", INIT_HEIGHT));
        },
        onResizeStop: ({ resizeStop, updateElement, element, setHeight, localHeight }) => () => {
            resizeStop();
            updateElement({ element: set(element, "settings.style.height", localHeight) });
            setHeight(null);
        },
        onResize: ({ setHeight, localHeight }) => diff => {
            setHeight(Math.max(MIN_HEIGHT, localHeight - diff));
        }
    })
)(SpacerContainer);
