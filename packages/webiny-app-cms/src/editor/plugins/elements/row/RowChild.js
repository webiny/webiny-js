// @flow
import * as React from "react";
import { compose, withHandlers, pure } from "recompose";
import { connect } from "react-redux";
import styled from "react-emotion";
import DropZone from "webiny-app-cms/editor/components/DropZone";
import Resizer from "webiny-app-cms/editor/components/Resizer";
import Element from "webiny-app-cms/editor/components/Element";
import { dropElement } from "webiny-app-cms/editor/actions";
import { getIsDragging } from "webiny-app-cms/editor/selectors";
import ResizeHandle from "./ResizeHandle";

const ColumnContainer = styled("div")({
    position: "relative",
    display: "flex"
});

type Props = {
    element: Object,
    index: number,
    last: boolean,
    target: Object,
    dropElementLeft: Function,
    dropElementRight: Function
};

const RowChild = pure(({
    target,
    element,
    index,
    last = false,
    dropElementLeft,
    dropElementRight
}: Props) => {
    return (
        <ColumnContainer
            data-type="row-column-container"
            style={{ width: (element.data.width || 100) + "%" }}
        >
            {/*{index > 0 && (
                <Resizer
                    axis={"x"}
                    onResizeStart={() => resizeStart()}
                    onResizeStop={() => {
                        resizeStop();
                        updateElement({ element: rowElement });
                    }}
                    onResize={diff => {
                        if (!row.current) {
                            return;
                        }

                        const change = (diff / row.current.offsetWidth) * 100;
                        resizeRowColumn({ row: path, column: index, change });
                    }}
                >
                    {resizeProps => (
                        <ResizeHandle
                            {...resizeProps}
                            leftWidth={childElements[index - 1].data.width}
                            rightWidth={element.data.width}
                        />
                    )}
                </Resizer>
            )}*/}
            <DropZone.Left type={target.type} onDrop={dropElementLeft} />
            <Element id={element.id} />
            {last && <DropZone.Right type={target.type} onDrop={dropElementRight} />}
        </ColumnContainer>
    );
});

export default compose(
    connect(
        (state, props) => ({ isDragging: getIsDragging(state), element: state.elements[props.id] }),
        { dropElement }
    ),
    withHandlers({
        dropElementLeft: ({ dropElement, target, index }) => (source: Object) => {
            dropElement({ source, target: { ...target, position: index } });
        },
        dropElementRight: ({ dropElement, target, index, count }) => (source: Object) => {
            dropElement({ source, target: { ...target, position: count } });
        }
    })
)(RowChild);
