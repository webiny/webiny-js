import React from "react";
import Block from "./Block";
import {
    CreateElementActionEvent,
    DeleteElementActionEvent,
    updateElementAction
} from "../../../recoil/actions";
import { addElementToParent, createDroppedElement } from "../../../helpers";
import {
    DisplayMode,
    EventActionHandlerActionCallableResponse,
    PbEditorPageElementPlugin,
    PbEditorElement
} from "../../../../types";
import { AfterDropElementActionEvent } from "../../../recoil/actions/afterDropElement";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";

export default (): PbEditorPageElementPlugin => {
    return {
        name: "pb-editor-page-element-block",
        type: "pb-editor-page-element",
        elementType: "block",
        settings: [
            "pb-editor-page-element-style-settings-background",
            "pb-editor-page-element-style-settings-animation",
            "pb-editor-page-element-style-settings-border",
            "pb-editor-page-element-style-settings-shadow",
            "pb-editor-page-element-style-settings-padding",
            "pb-editor-page-element-style-settings-margin",
            "pb-editor-page-element-style-settings-width",
            "pb-editor-page-element-style-settings-height",
            "pb-editor-page-element-style-settings-horizontal-align-flex",
            "pb-editor-page-element-style-settings-vertical-align",
            "pb-editor-page-element-settings-clone",
            "pb-editor-page-element-settings-delete"
        ],
        create(options = {}) {
            return {
                type: "block",
                elements: [],
                data: {
                    settings: {
                        width: createInitialPerDeviceSettingValue(
                            { value: "100%" },
                            DisplayMode.DESKTOP
                        ),
                        margin: {
                            ...createInitialPerDeviceSettingValue(
                                {
                                    top: "0px",
                                    right: "0px",
                                    bottom: "0px",
                                    left: "0px",
                                    advanced: true
                                },
                                DisplayMode.DESKTOP
                            )
                        },
                        padding: createInitialPerDeviceSettingValue(
                            { all: "10px" },
                            DisplayMode.DESKTOP
                        ),
                        horizontalAlignFlex: createInitialPerDeviceSettingValue(
                            "center",
                            DisplayMode.DESKTOP
                        ),
                        verticalAlign: createInitialPerDeviceSettingValue(
                            "flex-start",
                            DisplayMode.DESKTOP
                        )
                    }
                },
                ...options
            };
        },
        render(props) {
            return <Block {...props} />;
        },
        // This callback is executed when another element is dropped on the drop zones with type "block"
        onReceived({ source, target, position = null, state, meta }) {
            const element = createDroppedElement(source as any, target);

            const block = addElementToParent(element, target, position);

            const result = updateElementAction(state, meta, {
                element: block,
                history: true
            }) as EventActionHandlerActionCallableResponse;

            result.actions.push(
                new AfterDropElementActionEvent({
                    element
                })
            );

            if (source.id) {
                // Delete source element
                result.actions.push(
                    new DeleteElementActionEvent({
                        element: source as PbEditorElement
                    })
                );

                return result;
            }

            result.actions.push(
                new CreateElementActionEvent({
                    element,
                    source: source as any
                })
            );
            return result;
        }
    };
};
