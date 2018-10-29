//@flow
import React from "react";
import { css } from "emotion";
import { connect } from "react-redux";
import { compose, withHandlers, withProps, withState, pure } from "recompose";
import ElementStyle from "webiny-app-cms/render/components/ElementStyle";
import { dropElement, updateElement } from "webiny-app-cms/editor/actions";
import { resizeRowColumn, resizeStart, resizeStop } from "./actions";
import RowChild from "./RowChild";

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
        dropElement,
        updateElement,
        resizeRowColumn,
        resizeStart,
        resizeStop,
        childElements,
        rowRef
    }) => {
        const { id, path, type, elements } = element;

        return (
            <ElementStyle element={element} style={{ zIndex: 20, position: "relative" }}>
                <div ref={rowRef} className={innerElement}>
                    {elements.map((childId, index) => (
                        <RowChild
                            key={childId}
                            id={childId}
                            index={index}
                            count={elements.length}
                            last={index === elements.length - 1}
                            target={{ id, path, type }}
                        />
                    ))}
                </div>
            </ElementStyle>
        );
    }
);

export default compose(
    connect(
        null,
        { dropElement, updateElement, resizeRowColumn, resizeStart, resizeStop }
    ),
    withProps(() => ({
        rowRef: React.createRef()
    }))
)(Row);
