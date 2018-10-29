//@flow
import React from "react";
import styled from "react-emotion";
import { css } from "emotion";
import { connect } from "react-redux";
import { compose, withHandlers, pure } from "recompose";
import { IconButton } from "webiny-ui/Button";
import ElementStyle from "webiny-app-cms/render/components/ElementStyle";
import DropZone from "webiny-app-cms/editor/components/DropZone";
import { ReactComponent as AddCircleOutline } from "webiny-app-cms/editor/assets/icons/baseline-add_circle-24px.svg";
import { dropElement, togglePlugin } from "webiny-app-cms/editor/actions";
import ColumnChild from "./ColumnChild";

const ColumnContainer = styled("div")({
    position: "relative",
    flex: "1 100%",
    boxSizing: "border-box",
    height: "100%",
    width: "100%",
    zIndex: 20
});

const addIcon = css({
    color: "var(--mdc-theme-secondary)",
    transition: "transform 0.2s",
    "&:hover": {
        transform: "scale(1.3)"
    },
    "&::before, &::after": {
        display: "none"
    }
});

const Column = pure(({ element, dropElement, togglePlugin }) => {
    const { id, path, type, elements } = element;

    return (
        <ColumnContainer>
            <ElementStyle element={element} className={"test-inner"} style={{ height: "100%" }}>
                {!elements.length && (
                    <DropZone.Center id={id} type={type} onDrop={dropElement}>
                        <IconButton
                            className={addIcon + " addIcon"}
                            icon={<AddCircleOutline />}
                            onClick={togglePlugin}
                        />
                    </DropZone.Center>
                )}
                {elements.map((childId, index) => (
                    <ColumnChild
                        key={childId}
                        id={childId}
                        index={index}
                        count={elements.length}
                        last={index === elements.length - 1}
                        target={{ id, path, type }}
                    />
                ))}
            </ElementStyle>
        </ColumnContainer>
    );
});

export default compose(
    connect(
        null,
        { dropElement, togglePlugin }
    ),
    withHandlers({
        togglePlugin: ({ togglePlugin, element: { id, path, type } }) => () => {
            togglePlugin({
                name: "cms-toolbar-add-element",
                params: { id, path, type }
            });
        },
        dropElement: ({ dropElement, element: { id, path, type } }) => (source: Object) => {
            dropElement({ source, target: { id, path, type, position: null } });
        }
    })
)(Column);
