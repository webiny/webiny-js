//@flow
import React from "react";
import styled from "react-emotion";
import { set } from "dot-prop-immutable";
import { dispatch } from "webiny-app-cms/editor/redux";
import { createElement, createColumn, cloneElement } from "webiny-app-cms/editor/utils";
import { updateElement, deleteElement } from "webiny-app-cms/editor/actions";
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
        element: {
            title: "Row",
            group: "cms-element-group-layout",
            settings: [
                "cms-element-settings-background",
                "",
                "cms-element-settings-border",
                "cms-element-settings-shadow",
                "",
                "cms-element-settings-padding",
                "cms-element-settings-margin",
                "",
                "cms-element-settings-clone",
                "cms-element-settings-delete",
                "",
                "cms-element-settings-advanced"
            ]
        },
        // Target drop zones that will accept this type
        target: ["cms-element-block", "cms-element-column"],
        // This function is called when `createElement` is called for this plugin
        create(options = {}) {
            const row = {
                type: "cms-element-row",
                elements: [],
                settings: {
                    style: {
                        margin: "15px",
                        padding: "15px"
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

        // Render element preview
        preview() {
            return (
                <PreviewBox>
                    <RowIcon />
                </PreviewBox>
            );
        },

        // This callback is executed when another element is dropped on the drop zones with type "row"
        onReceived({ source, target, position = null }) {
            let element = source.path ? cloneElement(source) : createElement(source.type, {}, target);

            if (element.type !== "column") {
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

const addElementToParent = (element, parent, position) => {
    if (position === null) {
        return set(parent, "elements", [...parent.elements, element]);
    }

    return set(parent, "elements", [
        ...parent.elements.slice(0, position),
        element,
        ...parent.elements.slice(position)
    ]);
};
