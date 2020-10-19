import React from "react";
import Block from "./Block";
import {
    useEditorEventActionHandler,
    useEditorEventActionTransaction
} from "@webiny/app-page-builder/editor/provider";
import {
    CreateElementEventAction,
    DeleteElementEventAction,
    UpdateElementEventAction
} from "@webiny/app-page-builder/editor/recoil/modules/elements/eventAction";
import {
    createElement,
    createRow,
    createColumn,
    cloneElement,
    addElementToParent
} from "@webiny/app-page-builder/editor/utils";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";

export default (): PbEditorPageElementPlugin => {
    return {
        name: "pb-editor-page-element-block",
        type: "pb-editor-page-element",
        elementType: "block",
        settings: [
            "pb-editor-page-element-settings-background",
            "pb-editor-page-element-settings-animation",
            "",
            "pb-editor-page-element-settings-border",
            "pb-editor-page-element-settings-shadow",
            "",
            "pb-editor-page-element-settings-padding",
            "pb-editor-page-element-settings-margin",
            "pb-editor-page-element-settings-width",
            "pb-editor-page-element-settings-height",
            "pb-editor-page-element-settings-horizontal-align-flex",
            "pb-editor-page-element-settings-vertical-align",
            "",
            "pb-editor-page-element-settings-clone",
            "pb-editor-page-element-settings-delete",
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
        onReceived({ source, target, position = null }: any) {
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
            const eventActionHandler = useEditorEventActionHandler();
            const eventActionTransaction = useEditorEventActionTransaction();

            return eventActionTransaction(async () => {
                await eventActionHandler.trigger(
                    new UpdateElementEventAction({
                        element: block
                    })
                );
                // updateElementAction({element: block});
                // redux.store.dispatch(updateElement({ element: block }));

                // Delete exiting element
                if (source.path) {
                    await eventActionHandler.trigger(
                        new DeleteElementEventAction({
                            element: source
                        })
                    );
                    // deleteElementAction({element: source});
                    // redux.store.dispatch(deleteElement({ element: source }));
                }
                if (!dispatchNew) {
                    return;
                }
                await eventActionHandler.trigger(
                    new CreateElementEventAction({
                        element,
                        source
                    })
                );
                // redux.store.dispatch(elementCreated({ element, source }));
            });
        },
        onChildDeleted({ element }) {
            if (element.elements.length > 0) {
                return;
            }
            const newElement = {
                ...element,
                elements: [
                    createRow({
                        elements: [
                            createColumn({
                                data: {
                                    width: 100
                                }
                            })
                        ]
                    })
                ]
            };

            const eventActionHandler = useEditorEventActionHandler();
            eventActionHandler.trigger(
                new UpdateElementEventAction({
                    element: newElement
                })
            );
            // redux.store.dispatch(updateElement({ element }));
        }
    };
};
