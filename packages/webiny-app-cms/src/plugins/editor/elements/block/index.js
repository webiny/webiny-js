// @flow
import React from "react";
import { dispatch } from "webiny-app/redux";
import Block from "./Block";
import { set } from "dot-prop-immutable";
import { createElement, createRow, createColumn, cloneElement } from "webiny-app-cms/editor/utils";
import { updateElement, deleteElement } from "webiny-app-cms/editor/actions";
import type { ElementPluginType } from "webiny-app-cms/types";

export default (): ElementPluginType => {
    return {
        name: "cms-element-block",
        type: "cms-element",
        element: {
            name: "block",
            settings: [
                "cms-element-settings-background",
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
                "",
                "cms-element-settings-advanced"
            ]
        },
        create(options = {}) {
            return {
                type: "cms-element-block",
                elements: [
                    createRow({
                        elements: [createColumn({ data: { width: 100 } })]
                    })
                ],
                ...options
            };
        },
        render(props) {
            return <Block {...props} />;
        },
        // This callback is executed when another element is dropped on the drop zones with type "block"
        onReceived({ store, source, target, position = null }) {
            const element = source.path
                ? cloneElement(source)
                : createElement(source.type, {}, target);

            const block = addElementToParent(element, target, position);

            // Dispatch update action
            store.dispatch(updateElement({ element: block }));

            // Delete exiting element
            if (source.path) {
                store.dispatch(deleteElement({ element: source }));
            }
        },
        onChildDeleted({ element }) {
            if (element.elements.length === 0) {
                element = set(element, "elements", [
                    createRow({
                        elements: [createColumn({ data: { width: 100 } })]
                    })
                ]);
                dispatch(updateElement({ element }));
            }
        }
    };
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
