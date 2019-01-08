// @flow
import React from "react";
import { redux } from "webiny-app-cms/editor/redux";
import Block from "./Block";
import { set } from "dot-prop-immutable";
import {
    createElement,
    createRow,
    createColumn,
    cloneElement,
    addElementToParent
} from "webiny-app-cms/editor/utils";
import { updateElement, deleteElement, elementCreated } from "webiny-app-cms/editor/actions";
import type { ElementPluginType } from "webiny-app-cms/types";

export default (): ElementPluginType => {
    return {
        name: "cms-element-block",
        type: "cms-element",
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
            "cms-element-settings-height",
            "cms-element-settings-horizontal-align-flex",
            "cms-element-settings-vertical-align",
            "",
            "cms-element-settings-clone",
            "cms-element-settings-delete",
            ""
        ],
        create(options = {}) {
            return {
                type: "cms-element-block",
                elements: [
                    createRow({
                        elements: [createColumn({ data: { width: 100 } })]
                    })
                ],
                data: {
                    settings: {
                        width: { value: "1000px" },
                        margin: {
                            mobile: { top: 15, left: 15, right: 15, bottom: 15 },
                            desktop: { top: 25, left: 0, right: 0, bottom: 25 },
                            advanced: true
                        },
                        padding: {
                            mobile: { all: 10 },
                            desktop: { all: 0 }
                        }
                    }
                },
                ...options
            };
        },
        render(props) {
            return <Block {...props} />;
        },
        // This callback is executed when another element is dropped on the drop zones with type "block"
        onReceived({ source, target, position = null }) {
            let dispatchNew = false;
            let element;
            if (source.path) {
                element = cloneElement(source);
            } else {
                dispatchNew = true;
                element = createElement(source.type, {}, target);
            }

            const block = addElementToParent(element, target, position);

            // Dispatch update action
            redux.store.dispatch(updateElement({ element: block }));

            // Delete exiting element
            if (source.path) {
                redux.store.dispatch(deleteElement({ element: source }));
            }

            if (dispatchNew) {
                redux.store.dispatch(elementCreated({ element, source }));
            }
        },
        onChildDeleted({ element }) {
            if (element.elements.length === 0) {
                element = set(element, "elements", [
                    createRow({
                        elements: [createColumn({ data: { width: 100 } })]
                    })
                ]);

                redux.store.dispatch(updateElement({ element }));
            }
        }
    };
};
