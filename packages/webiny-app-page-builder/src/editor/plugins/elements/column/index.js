//@flow
import React from "react";
import styled from "react-emotion";
import { set } from "dot-prop-immutable";
import { redux } from "webiny-app-page-builder/editor/redux";
import Column from "./Column";
import {
    createElement,
    createColumn,
    cloneElement,
    addElementToParent
} from "webiny-app-page-builder/editor/utils";
import { updateElement, deleteElement, elementCreated } from "webiny-app-page-builder/editor/actions";
import { getParentElementWithChildren } from "webiny-app-page-builder/editor/selectors";
import { ReactComponent as ColumnIcon } from "webiny-app-page-builder/editor/assets/icons/column-icon.svg";
import type { PbElementPluginType } from "webiny-app-page-builder/types";

export default (): PbElementPluginType => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        height: 50,
        svg: {
            height: 50,
            width: 50
        }
    });

    return {
        name: "pb-page-element-column",
        type: "pb-page-element",
        elementType: "column",
        toolbar: {
            title: "Column",
            group: "pb-editor-element-group-layout",
            preview() {
                return (
                    <PreviewBox>
                        <ColumnIcon />
                    </PreviewBox>
                );
            }
        },
        settings: [
            "pb-page-element-settings-background",
            "pb-page-element-settings-animation",
            "",
            "pb-page-element-settings-border",
            "pb-page-element-settings-shadow",
            "",
            "pb-page-element-settings-padding",
            "pb-page-element-settings-margin",
            "pb-page-element-settings-horizontal-align",
            "pb-page-element-settings-vertical-align",
            "",
            "pb-page-element-settings-clone",
            "pb-page-element-settings-delete",
            ""
        ],
        target: ["row"],
        create(options = {}) {
            return {
                type: "column",
                data: {
                    ...(options.data || {}),
                    settings: {
                        margin: {
                            desktop: { all: 0 },
                            mobile: { all: 0 }
                        },
                        padding: {
                            desktop: { all: 0 },
                            mobile: { all: 0 }
                        }
                    }
                },
                elements: options.elements || []
            };
        },
        render(props) {
            return <Column {...props} />;
        },
        canDelete({ element }) {
            const parent = getParentElementWithChildren(redux.store.getState(), element.id);
            return parent.elements.length > 1;
        },
        onReceived({ source, target, position = null }) {
            const droppedOnCenter = position === null;

            // Dropped a column onto a center drop zone
            if (source.type === "column" && droppedOnCenter) {
                return splitColumn(source, target);
            }

            handleDroppedElement(source, target, position);
        }
    };
};

const handleDroppedElement = (source, target, position) => {
    let dispatchNew = false;
    let element;
    
    if (source.path) {
        // $FlowFixMe
        element = cloneElement(source);
    } else {
        dispatchNew = true;
        element = createElement(source.type, {}, target);
    }
    
    target = addElementToParent(element, target, position);
    redux.store.dispatch(updateElement({ element: target }));

    if (source.path) {
        redux.store.dispatch(deleteElement({ element: source }));
    }

    if (dispatchNew) {
        redux.store.dispatch(elementCreated({ element, source }));
    }
};

const splitColumn = (source, target) => {
    let dispatchNew = false;
    let row = getParentElementWithChildren(redux.store.getState(), target.id);
    // $FlowFixMe
    const targetIndex = row.elements.findIndex(el => el.id === target.id);

    // Split target column in half
    // $FlowFixMe
    row.elements[targetIndex].data.width /= 2;

    // Create a new column with half of the original target width
    let newColumn;
    if (source.path) {
        // $FlowFixMe
        newColumn = cloneElement(source);
    } else {
        dispatchNew = true;
        newColumn = createColumn();
    }

    // $FlowFixMe
    newColumn = set(newColumn, "data.width", row.elements[targetIndex].data.width);

    row = addElementToParent(newColumn, row, targetIndex + 1);
    redux.store.dispatch(updateElement({ element: row }));

    if (source.path) {
        redux.store.dispatch(deleteElement({ element: source }));
    }

    if (dispatchNew) {
        redux.store.dispatch(elementCreated({ element: newColumn, source }));
    }
};
