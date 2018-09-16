//@flow
import React from "react";
import styled from "react-emotion";
import { css } from "emotion";
import { connect } from "react-redux";
import Element from "webiny-app-cms/editor/components/Element";
import DropZone from "webiny-app-cms/editor/components/DropZone";
import Resizer from "webiny-app-cms/editor/components/Resizer";
import ElementStyle from "webiny-app-cms/editor/components/ElementStyle";
import ResizeHandle from "./ResizeHandle";
import { dropElement, updateElement } from "webiny-app-cms/editor/actions";
import { getIsDragging } from "webiny-app-cms/editor/selectors";
import { resizeRowColumn, resizeStart, resizeStop } from "./actions";

const ColumnContainer = styled("div")({
    position: "relative",
    display: "flex"
});

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

const Row = ({
    element: rowElement,
    isDragging,
    dropElement,
    updateElement,
    resizeRowColumn,
    resizeStart,
    resizeStop
}) => {
    const { path, type, elements } = rowElement;
    const row = React.createRef();

    return (
        <ElementStyle element={rowElement} style={{zIndex: 20, position: 'relative'}}>
            <div ref={row} className={innerElement}>
                {elements.map((element, index) => (
                    <ColumnContainer
                        data-type="row-column-container"
                        key={element.id}
                        style={{ width: (element.data.width || 100) + "%" }}
                    >
                        {index > 0 &&
                            !isDragging && (
                                <Resizer
                                    axis={"x"}
                                    onResizeStart={() => resizeStart()}
                                    onResizeStop={() => {
                                        resizeStop();
                                        updateElement({ element: rowElement });
                                    }}
                                    onResize={diff => {
                                        const change = (diff / row.current.offsetWidth) * 100;
                                        resizeRowColumn({ row: path, column: index, change });
                                    }}
                                >
                                    {resizeProps => (
                                        <ResizeHandle
                                            {...resizeProps}
                                            leftWidth={elements[index - 1].data.width}
                                            rightWidth={element.data.width}
                                        />
                                    )}
                                </Resizer>
                            )}
                        <DropZone.Left
                            type={type}
                            onDrop={source =>
                                dropElement({ source, target: { path, type, position: index } })
                            }
                        />
                        <Element element={element} />
                        {index === elements.length - 1 && (
                            <DropZone.Right
                                type={type}
                                onDrop={source =>
                                    dropElement({
                                        source,
                                        target: { path, type, position: elements.length }
                                    })
                                }
                            />
                        )}
                    </ColumnContainer>
                ))}
            </div>
        </ElementStyle>
    );
};

export default connect(
    state => ({
        isDragging: getIsDragging(state)
    }),
    { dropElement, updateElement, resizeRowColumn, resizeStart, resizeStop }
)(Row);
