//@flow
import React from "react";
import styled from "react-emotion";
import { connect } from "react-redux";
import Element from "webiny-app-cms/editor/components/Element";
import ElementStyle from "webiny-app-cms/editor/components/ElementStyle";
import DropZone from "webiny-app-cms/editor/components/DropZone";
import { dropElement } from "webiny-app-cms/editor/actions";

const CardContainer = styled("div")({
    position: "relative",
    flex: "1 100%",
    boxSizing: "border-box",
    height: "100%",
    width: "100%",
    padding: 10
});

const Card = ({ element, dropElement }) => {
    const { id, path, type, elements } = element;

    return (
        <CardContainer>
            <ElementStyle element={element} style={{ height: "100%" }}>
                {/* TODO: Remove Card when last child is deleted */}
                {elements.map((element, index) => (
                    <React.Fragment key={element.id}>
                        <DropZone.Above
                            type={type}
                            isVisible={({ isDragging }) => isDragging}
                            onDrop={source =>
                                dropElement({ source, target: { id, path, type, position: index } })
                            }
                        />
                        <Element element={element} />
                        {index === elements.length - 1 && (
                            <DropZone.Below
                                isVisible={({ isDragging }) => isDragging}
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
        </CardContainer>
    );
};

export default connect(
    null,
    { dropElement }
)(Card);
