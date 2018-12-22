//@flow
import React from "react";
import styled from "react-emotion";
import { css } from "emotion";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers, pure } from "recompose";
import { IconButton } from "webiny-ui/Button";
import {
    ElementStyle,
    getElementStyleProps,
    getElementAttributeProps
} from "webiny-app-cms/render/components/ElementStyle";
import DropZone from "webiny-app-cms/editor/components/DropZone";
import ConnectedElement from "webiny-app-cms/editor/components/ConnectedElement";
import { ReactComponent as AddCircleOutline } from "webiny-app-cms/editor/assets/icons/baseline-add_circle-24px.svg";
import { dropElement, togglePlugin } from "webiny-app-cms/editor/actions";
import { getElement } from "webiny-app-cms/editor/selectors";
import ColumnChild from "./ColumnChild";
import ElementAnimation from "webiny-app-cms/render/components/ElementAnimation";

const ColumnContainer = styled("div")({
    position: "relative",
    flex: "1 100%",
    boxSizing: "border-box",
    height: "100%",
    width: "100%",
    zIndex: 20,
    display: "flex"
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
    return (
        <ElementAnimation>
            <ColumnContainer>
                <ElementStyle
                    {...getElementStyleProps(element)}
                    {...getElementAttributeProps(element)}
                    style={{ width: "100%", display: "flex", flexDirection: "column" }}
                >
                    <ConnectedElement elementId={element.id}>
                        {({ id, path, type, elements }) => (
                            <React.Fragment>
                                {!elements.length && (
                                    <DropZone.Center
                                        key={id}
                                        id={id}
                                        type={type}
                                        onDrop={dropElement}
                                    >
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
                            </React.Fragment>
                        )}
                    </ConnectedElement>
                </ElementStyle>
            </ColumnContainer>
        </ElementAnimation>
    );
});

export default compose(
    connect(
        (state, props) => {
            const element = getElement(state, props.element.id);
            return {
                element: { ...element, elements: element.elements.map(id => getElement(state, id)) }
            };
        },
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
