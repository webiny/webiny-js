//@flow
import React from "react";
import styled from "react-emotion";
import { css } from "emotion";
import { connect } from "react-redux";
import { IconButton } from "webiny-ui/Button";
import Element from "webiny-app-cms/editor/components/Element";
import ElementStyle from "webiny-app-cms/editor/components/ElementStyle";
import DropZone from "webiny-app-cms/editor/components/DropZone";
import { ReactComponent as AddCircleOutline } from "webiny-app-cms/editor/assets/icons/baseline-add_circle-24px.svg";
import { dropElement, togglePlugin } from "webiny-app-cms/editor/actions";

const ColumnContainer = styled("div")({
    position: "relative",
    flex: "1 100%",
    boxSizing: "border-box",
    height: "100%",
    width: "100%",
    zIndex: 20,
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

const Column = ({ element, dropElement, togglePlugin }) => {
    const { id, path, type, elements } = element;

    return (
        <ColumnContainer>
            <ElementStyle element={element} className={"test-inner"} style={{ height: "100%" }}>
                {!elements.length && (
                    <DropZone.Center
                        element={element}
                        type={type}
                        onDrop={source =>
                            dropElement({ source, target: { id, path, type, position: null } })
                        }
                    >
                        <IconButton
                            className={addIcon + " addIcon"}
                            icon={<AddCircleOutline />}
                            onClick={() =>
                                togglePlugin({ name: "add-element", params: { id, path, type } })
                            }
                        />
                    </DropZone.Center>
                )}
                {elements.map((element, index) => (
                    <React.Fragment key={element.id}>
                        <DropZone.Above
                            type={type}
                            onDrop={source =>
                                dropElement({ source, target: { id, path, type, position: index } })
                            }
                        />
                        <Element element={element} />
                        {index === elements.length - 1 && (
                            <DropZone.Below
                                type={type}
                                onDrop={source =>
                                    dropElement({
                                        source,
                                        target: { id, path, type, position: elements.length }
                                    })
                                }
                            />
                        )}
                    </React.Fragment>
                ))}
            </ElementStyle>
        </ColumnContainer>
    );
};

export default connect(
    null,
    { dropElement, togglePlugin }
)(Column);
