// @flow
import * as React from "react";
import { compose, withHandlers, pure, setDisplayName } from "recompose";
import { connect } from "webiny-app-cms/editor/redux";
import { css } from "emotion";
import { get } from "lodash";
import styled from "react-emotion";
import DropZone from "webiny-app-cms/editor/components/DropZone";
import Resizer from "webiny-app-cms/editor/components/Resizer";
import Element from "webiny-app-cms/editor/components/Element";
import { dropElement } from "webiny-app-cms/editor/actions";
import { getIsDragging } from "webiny-app-cms/editor/selectors";
import ResizeHandle from "./ResizeHandle";

const ColumnContainer = styled("div")({
    position: "relative",
    display: "flex",
    "&:hover": {
        ">.resize-handle": {
            display: "block !important"
        }
    }
});

type Props = {
    resizing: boolean,
    element: Object,
    leftElement: Object,
    index: number,
    last: boolean,
    target: Object,
    dropElementLeft: Function,
    dropElementRight: Function,
    resizeStart: Function,
    resizeStop: Function,
    resize: Function
};

const noPointer = css({
    "> *": {
        pointerEvents: "none"
    }
});

const RowChild = pure(
    ({
        target,
        resizing,
        element,
        index,
        leftElement,
        last = false,
        dropElementLeft,
        dropElementRight,
        resizeStart,
        resizeStop,
        resize
    }: Props) => {
        return (
            <ColumnContainer
                data-type="row-column-container"
                style={{ width: get(element, "data.width", 100) + "%", position: "relative" }}
            >
                {index > 0 && (
                    <Resizer
                        axis={"x"}
                        onResizeStart={resizeStart}
                        onResizeStop={resizeStop}
                        onResize={resize}
                    >
                        {resizeProps => (
                            <ResizeHandle
                                {...resizeProps}
                                leftWidth={leftElement.data.width}
                                rightWidth={element.data.width}
                            />
                        )}
                    </Resizer>
                )}
                <DropZone.Left type={target.type} onDrop={dropElementLeft} />
                <Element id={element.id} className={resizing && noPointer} />
                {last && <DropZone.Right type={target.type} onDrop={dropElementRight} />}
            </ColumnContainer>
        );
    }
);

export default compose(
    setDisplayName("RowChild"),
    connect(
        state => ({
            isDragging: getIsDragging(state)
        }),
        { dropElement }
    ),
    withHandlers({
        resizeStart: ({ onResizeStart, element, leftElement }) => () => {
            onResizeStart(leftElement, element);
        },
        resizeStop: ({ onResizeStop }) => () => onResizeStop(),
        resize: ({ onResize }) => diff => onResize(diff),
        dropElementLeft: ({ dropElement, target, index }) => (source: Object) => {
            dropElement({ source, target: { ...target, position: index } });
        },
        dropElementRight: ({ dropElement, target, count }) => (source: Object) => {
            dropElement({ source, target: { ...target, position: count } });
        }
    })
)(RowChild);
