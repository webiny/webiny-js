//@flow
import React from "react";
import { css } from "emotion";
import styled from "react-emotion";
import { pure } from "recompose";
import { connect } from "react-redux";
import Element from "webiny-app-cms/editor/components/Element";
import ElementStyle from "webiny-app-cms/render/components/ElementStyle";
import DropZone from "webiny-app-cms/editor/components/DropZone";
import { dropElement } from "webiny-app-cms/editor/actions";

const BlockContainer = styled("div")({
    position: "relative",
    color: "#666",
    padding: 5,
    boxSizing: "border-box"
});

const Block = pure(({ element, dropElement }) => {
    const { id, type, elements } = element;
    return (
        <BlockContainer id={id} style={{ zIndex: 20, position: "relative" }}>
            <ElementStyle style={{ margin: "0 auto", boxSizing: "border-box" }} element={element}>
                {({ elementStyle, inlineStyle, customClasses, combineClassNames }) => {
                    const { width, ...containerStyle } = elementStyle;
                    return (
                        <div style={{ width: "100%" }} className={css(containerStyle)}>
                            <div
                                style={{ width, margin: "0 auto" }}
                                className={combineClassNames(inlineStyle, ...customClasses)}
                            >
                                {!elements.length && (
                                    <DropZone.Center element={element}>
                                        Add an element here
                                    </DropZone.Center>
                                )}
                                {elements.map((childId, index) => (
                                    <React.Fragment key={childId}>
                                        <DropZone.Above
                                            type={type}
                                            onDrop={source =>
                                                dropElement({
                                                    source,
                                                    target: { id, type, position: index }
                                                })
                                            }
                                        />
                                        <Element key={childId} id={childId} />
                                        {index === elements.length - 1 && (
                                            <DropZone.Below
                                                type={type}
                                                onDrop={source => {
                                                    dropElement({
                                                        source,
                                                        target: {
                                                            id,
                                                            type,
                                                            position: elements.length
                                                        }
                                                    });
                                                }}
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    );
                }}
            </ElementStyle>
        </BlockContainer>
    );
});

export default connect(
    null,
    { dropElement }
)(Block);
