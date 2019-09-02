// @flow
import React, { useState, useCallback } from "react";
import { css } from "emotion";
import styled from "react-emotion";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { set } from "dot-prop-immutable";
import { get } from "lodash";
import Resizer from "@webiny/app-page-builder/editor/components/Resizer";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getElement } from "@webiny/app-page-builder/editor/selectors";
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
    element,
    elementStyle,
    customClasses,
    combineClassNames,
    updateElement,
    resizeStart,
    resizeStop
}) => {
    const [localHeight, setHeight] = useState(null);
    let { height = MIN_HEIGHT, ...spacerStyle } = elementStyle;
    if (localHeight) {
        height = localHeight;
    }

    const onResizeStart = useCallback(() => {
        resizeStart();
        setHeight(get(element, "data.settings.height.value", MIN_HEIGHT));
    }, [element]);

    const onResizeStop = useCallback(() => {
        resizeStop();
        updateElement({ element: set(element, "data.settings.height.value", localHeight) });
        setHeight(null);
    }, [element, localHeight]);

    const onResize = useCallback(
        diff => {
            setHeight(Math.max(MIN_HEIGHT, localHeight - diff));
        },
        [localHeight]
    );

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

export default connect(
    (state, props) => ({ element: getElement(state, props.elementId) }),
    { updateElement, resizeStart, resizeStop }
)(SpacerContainer);
