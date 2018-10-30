//@flow
import React from "react";
import { css } from "emotion";
import { connect } from "react-redux";
import { set } from "dot-prop-immutable";
import omit from "lodash/omit";
import { compose, withHandlers, withProps, withState, pure } from "recompose";
import ElementStyle from "webiny-app-cms/render/components/ElementStyle";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getElementById } from "webiny-app-cms/editor/selectors";
import RowChild from "./RowChild";
import { resizeStart, resizeStop } from "./actions";

const innerElement = css({
    position: "relative",
    display: "flex",
    flex: "1 100%",
    boxSizing: "border-box",
    "&:hover": {
        ".resize-handle": {
            display: "block !important"
        }
    }
});

const Row = pure(
    ({
        element,
        childElements,
        getRef,
        onResizeStart,
        onResizeStop,
        onResize,
        width,
        resizing
    }) => {
        const { id, path, type } = element;
        const ref = getRef();

        return (
            <ElementStyle element={element} style={{ zIndex: 20, position: "relative" }}>
                <div ref={ref} className={innerElement}>
                    {childElements.map((element, index) => {
                        const last = index === childElements.length - 1;
                        let leftElement = index > 0 && childElements[index - 1];
                        if (resizing) {
                            if (resizing.left.id === element.id) {
                                element = set(element, "data.width", width.left);
                            }

                            if (resizing.right.id === element.id) {
                                element = set(element, "data.width", width.right);
                                leftElement = set(leftElement, "data.width", width.left);
                            }
                        }
                        return (
                            <RowChild
                                key={element.id}
                                element={element}
                                index={index}
                                leftElement={leftElement}
                                count={childElements.length}
                                last={last}
                                target={{ id, path, type }}
                                onResizeStart={onResizeStart}
                                onResizeStop={onResizeStop}
                                onResize={onResize}
                            />
                        );
                    })}
                </div>
            </ElementStyle>
        );
    }
);

export default compose(
    connect(
        (state, props) => ({
            childElements: props.element.elements.map(id =>
                omit(getElementById(state, id), ["elements"])
            )
        }),
        { updateElement, resizeStart, resizeStop }
    ),
    withState("resizing", "setResizing", false),
    withState("width", "setWidth", null),
    withHandlers(() => {
        const rowRef = React.createRef();
        return {
            getRef: () => () => rowRef
        };
    }),
    withHandlers({
        onResizeStart: ({ setResizing, setWidth, resizeStart }) => (leftElement, rightElement) => {
            resizeStart();
            setResizing({ left: leftElement, right: rightElement });
            setWidth({ left: leftElement.data.width, right: rightElement.data.width });
        },
        onResizeStop: ({
            resizeStop,
            updateElement,
            setResizing,
            setWidth,
            resizing,
            width
        }) => () => {
            const { left, right } = resizing;
            setResizing(false);
            updateElement({ element: set(left, "data.width", width.left) });
            updateElement({ element: set(right, "data.width", width.right) });
            setWidth(null);
            resizeStop();
        },
        onResize: ({ getRef, width, setWidth }) => diff => {
            const change = parseFloat(((diff / getRef().current.offsetWidth) * 100).toFixed(2));

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
        }
    })
)(Row);
