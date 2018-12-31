// @flow
import * as React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { css } from "emotion";
import { isEqual } from "lodash";
import Element from "webiny-app-cms/editor/components/Element";
import DropZone from "webiny-app-cms/editor/components/DropZone";
import { dropElement } from "webiny-app-cms/editor/actions";
import { getElement } from "webiny-app-cms/editor/selectors";

const BlockContainer = ({
    elementStyle,
    elementAttributes,
    customClasses,
    combineClassNames,
    element,
    dropElement
}: Object) => {
    const { width, alignItems, justifyContent, ...containerStyle } = elementStyle;
    const { id, type, elements } = element;

    return (
        <div
            style={{ width: "100%", display: "flex", justifyContent: "center" }}
            className={"webiny-cms-layout-block-container " + css(containerStyle)}
            {...elementAttributes}
        >
            <div
                style={{
                    width: width ? width : "100%",
                    alignSelf: justifyContent,
                    alignItems: alignItems
                }}
                className={combineClassNames(...customClasses)}
            >
                {!elements.length && (
                    <DropZone.Center element={element}>Add an element here</DropZone.Center>
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
};

export default connect(
    (state, props) => ({ element: getElement(state, props.elementId) }),
    { dropElement },
    null,
    { areStatePropsEqual: isEqual }
)(BlockContainer);
