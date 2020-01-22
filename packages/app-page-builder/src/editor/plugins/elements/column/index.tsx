import React from "react";
import styled from "@emotion/styled";
import { set } from "dot-prop-immutable";
import { redux } from "@webiny/app-page-builder/editor/redux";
import Column from "./Column";
import {
    createElement,
    createColumn,
    cloneElement,
    addElementToParent
} from "@webiny/app-page-builder/editor/utils";
import {
    updateElement,
    deleteElement,
    elementCreated
} from "@webiny/app-page-builder/editor/actions";
import { getParentElementWithChildren } from "@webiny/app-page-builder/editor/selectors";
import { ReactComponent as ColumnIcon } from "@webiny/app-page-builder/editor/assets/icons/column-icon.svg";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/admin/types";

export default (): PbEditorPageElementPlugin => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        height: 50,
        svg: {
            height: 50,
            width: 50
        }
    });

    return {
        name: "pb-editor-page-element-column",
        type: "pb-editor-page-element",
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
            "pb-editor-page-element-settings-background",
            "pb-editor-page-element-settings-animation",
            "",
            "pb-editor-page-element-settings-border",
            "pb-editor-page-element-settings-shadow",
            "",
            "pb-editor-page-element-settings-padding",
            "pb-editor-page-element-settings-margin",
            "pb-editor-page-element-settings-horizontal-align",
            "pb-editor-page-element-settings-vertical-align",
            "",
            "pb-editor-page-element-settings-clone",
            "pb-editor-page-element-settings-delete",
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
    const targetIndex = row.elements.findIndex(el => el.id === target.id);

    // Split target column in half
    row.elements[targetIndex].data.width /= 2;

    // Create a new column with half of the original target width
    let newColumn;
    if (source.path) {
        newColumn = cloneElement(source);
    } else {
        dispatchNew = true;
        newColumn = createColumn();
    }

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
