//@flow
import React from "react";
import styled from "react-emotion";
import { set } from "dot-prop-immutable";
import { dispatch } from "webiny-app-cms/editor/redux";
import {
    createElement,
    createColumn,
    cloneElement,
    addElementToParent
} from "webiny-app-cms/editor/utils";
import { updateElement, deleteElement, elementCreated } from "webiny-app-cms/editor/actions";
import "./actions";
import Row from "./Row";
import { ReactComponent as RowIcon } from "webiny-app-cms/editor/assets/icons/row-icon.svg";
import type { ElementPluginType } from "webiny-app-cms/types";

export default (): ElementPluginType => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        height: 50,
        svg: {
            height: 50,
            width: 50
        }
    });

    return {
        name: "cms-element-row",
        type: "cms-element",
        toolbar: {
            title: "Row",
            group: "cms-element-group-layout",
            // Render element preview
            preview() {
                return (
                    <PreviewBox>
                        <RowIcon />
                    </PreviewBox>
                );
            }
        },
        settings: [
            "cms-element-settings-background",
            "cms-element-settings-animation",
            "",
            "cms-element-settings-border",
            "cms-element-settings-shadow",
            "",
            "cms-element-settings-padding",
            "cms-element-settings-margin",
            "cms-element-settings-width",
            "",
            "cms-element-settings-clone",
            "cms-element-settings-delete",
            ""
        ],
        // Target drop zones that will accept this type
        target: ["cms-element-block", "cms-element-column"],
        // This function is called when `createElement` is called for this plugin
        create(options = {}) {
            const row = {
                type: "cms-element-row",
                elements: [],
                settings: {
                    style: {
                        margin: { all: 15 },
                        padding: { all: 15 }
                    }
                },
                ...options
            };

            // A row MUST contain at least 1 column
            if (!row.elements.length) {
                row.elements.push(createColumn({ data: { width: 100 } }));
            }

            return row;
        },

        // Render element in editor
        render(props) {
            return <Row {...props} />;
        },

        // This callback is executed when another element is dropped on the drop zones with type "row"
        onReceived({ source, target, position = null }) {
            let dispatchNew = false;
            let element;
            if (source.path) {
                element = cloneElement(source);
            } else {
                dispatchNew = true;
                element = createElement(source.type, {}, target);
            }

            if (element.type !== "cms-element-column") {
                element = createColumn({ elements: [element] });
            }

            // Add new child element
            let row = addElementToParent(element, target, position);

            // Recalculate column widths
            row = distributeColumnWidths(row);

            // Dispatch update action
            dispatch(updateElement({ element: row }));

            if (source.path) {
                dispatch(deleteElement({ element: source }));
            }

            if (dispatchNew) {
                dispatch(elementCreated({ element, source }));
            }
        },

        onChildDeleted({ element }) {
            dispatch(updateElement({ element: distributeColumnWidths(element) }));
        }
    };
};

const distributeColumnWidths = row => {
    const width = Math.round((100 / row.elements.length) * 100) / 100;
    const columns = row.elements.map(el => {
        return set(el, "data.width", width);
    });
    return set(row, "elements", columns);
};
