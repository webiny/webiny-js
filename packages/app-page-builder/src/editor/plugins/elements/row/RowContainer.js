// @flow
import React, { useRef, useCallback, useState } from "react";
import { css } from "emotion";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { set } from "dot-prop-immutable";
import { isEqual } from "lodash";
import { getElement } from "@webiny/app-page-builder/editor/selectors";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { resizeStart, resizeStop } from "./actions";
import RowChild from "./RowChild";

const innerElement = css({
    position: "relative",
    display: "flex",
    flex: "1 100%",
    boxSizing: "border-box"
});

const RowContainer = ({ element, updateElement, resizeStart, resizeStop }) => {
    const ref = useRef({});
    const [resizing, setResizing] = useState(false);
    const [width, setWidth] = useState(null);

    const { id, path, type, elements } = element;

    const onResizeStart = useCallback(
        (leftElement, rightElement) => {
            resizeStart();
            setResizing({ left: leftElement, right: rightElement });
            setWidth({ left: leftElement.data.width, right: rightElement.data.width });
        },
        [resizeStart]
    );

    const onResizeStop = useCallback(() => {
        const { left, right } = resizing;
        setResizing(false);
        updateElement({ element: set(left, "data.width", width.left) });
        updateElement({ element: set(right, "data.width", width.right) });
        setWidth(null);
        resizeStop();
    }, [resizing, width, updateElement, resizeStop]);

    const onResize = useCallback(diff => {
        const change = parseFloat(((diff / ref.current.offsetWidth) * 100).toFixed(2));

        const totalWidth = width.left + width.right;

        // Apply the change
        let rightWidth = width.right + change;
        let leftWidth = totalWidth - rightWidth;

        if (rightWidth < 10) {
            rightWidth = 10;
            leftWidth = totalWidth - rightWidth;
        }

        if (leftWidth < 10) {
            leftWidth = 10;
            rightWidth = totalWidth - leftWidth;
        }

        setWidth({ left: leftWidth, right: rightWidth });
    }, [width]);

    return (
        <div ref={ref} className={innerElement}>
            {elements.map((childElement, index) => {
                const last = index === elements.length - 1;
                let leftElement = index > 0 && elements[index - 1];
                if (resizing) {
                    if (resizing.left.id === childElement.id) {
                        childElement = set(childElement, "data.width", width.left);
                    }

                    if (resizing.right.id === childElement.id) {
                        childElement = set(childElement, "data.width", width.right);
                        leftElement = set(leftElement, "data.width", width.left);
                    }
                }

                return (
                    <RowChild
                        key={childElement.id}
                        resizing={resizing}
                        element={childElement}
                        index={index}
                        leftElement={leftElement}
                        count={elements.length}
                        last={last}
                        target={{ id, path, type }}
                        onResizeStart={onResizeStart}
                        onResizeStop={onResizeStop}
                        onResize={onResize}
                    />
                );
            })}
        </div>
    );
};

export default connect(
    (state, props) => {
        const element = getElement(state, props.elementId);
        return {
            element: { ...element, elements: element.elements.map(id => getElement(state, id)) }
        };
    },
    { updateElement, resizeStart, resizeStop },
    null,
    { areStatePropsEqual: isEqual }
)(RowContainer);
