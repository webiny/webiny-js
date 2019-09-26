// @flow
import React, { useCallback } from "react";
import { css } from "emotion";
import { get } from "lodash";
import styled from "@emotion/styled";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import { connect } from "@webiny/app-page-builder/editor/redux";
import DropZone from "@webiny/app-page-builder/editor/components/DropZone";
import Resizer from "@webiny/app-page-builder/editor/components/Resizer";
import Element from "@webiny/app-page-builder/editor/components/Element";
import { dropElement } from "@webiny/app-page-builder/editor/actions";
import { getIsDragging } from "@webiny/app-page-builder/editor/selectors";
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

const RowChild = React.memo((props: Props) => {
    const {
        onResize,
        onResizeStop,
        target,
        resizing,
        element,
        index,
        leftElement,
        last = false
    } = props;

    const resize = useCallback(diff => onResize(diff), [onResize]);

    const { resizeStart, dropElementLeft, dropElementRight } = useHandlers(props, {
        resizeStart: ({ onResizeStart, element, leftElement }) => () => {
            onResizeStart(leftElement, element);
        },
        dropElementLeft: ({ target, index, dropElement }) => source => {
            dropElement({ source, target: { ...target, position: index } });
        },
        dropElementRight: ({ target, count, dropElement }) => source => {
            dropElement({ source, target: { ...target, position: count } });
        }
    });

    return (
        <ColumnContainer
            data-type="row-column-container"
            style={{ width: get(element, "data.width", 100) + "%", position: "relative" }}
        >
            {index > 0 && (
                <Resizer
                    axis={"x"}
                    onResizeStart={resizeStart}
                    onResizeStop={onResizeStop}
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
});

export default connect(
    state => ({
        isDragging: getIsDragging(state)
    }),
    { dropElement }
)(RowChild);
