// @flow
import React from "react";
import { redux } from "webiny-app-page-builder/editor/redux";
import Block from "./Block";
import { set } from "dot-prop-immutable";
import {
    createElement,
    createRow,
    createColumn,
    cloneElement,
    addElementToParent
} from "webiny-app-page-builder/editor/utils";
import { updateElement, deleteElement, elementCreated } from "webiny-app-page-builder/editor/actions";
import type { PbElementPluginType } from "webiny-app-page-builder/types";

export default (): PbElementPluginType => {
    return {
        name: "pb-page-element-block",
        type: "pb-page-element",
        elementType: "block",
        settings: [
            "pb-page-element-settings-background",
            "pb-page-element-settings-animation",
            "",
            "pb-page-element-settings-border",
            "pb-page-element-settings-shadow",
            "",
            "pb-page-element-settings-padding",
            "pb-page-element-settings-margin",
            "pb-page-element-settings-width",
            "pb-page-element-settings-height",
            "pb-page-element-settings-horizontal-align-flex",
            "pb-page-element-settings-vertical-align",
            "",
            "pb-page-element-settings-clone",
            "pb-page-element-settings-delete",
            ""
        ],
        create(options = {}) {
            return {
                type: "block",
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
                // $FlowFixMe
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
