import React from "react";
import kebabCase from "lodash/kebabCase";
import Block from "./Block";
import {
    CreateElementActionEvent,
    DeleteElementActionEvent,
    updateElementAction,
    UpdateElementActionArgsType
} from "~/editor/recoil/actions";
import { addElementToParent, createDroppedElement } from "~/editor/helpers";
import {
    DisplayMode,
    PbEditorPageElementPlugin,
    PbEditorElement,
    PbEditorElementPluginArgs
} from "~/types";
import { AfterDropElementActionEvent } from "~/editor/recoil/actions/afterDropElement";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";
import { executeAction } from "~/editor/recoil/eventActions";

export default (args: PbEditorElementPluginArgs = {}): PbEditorPageElementPlugin => {
    const elementSettings = [
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
    ];

    const elementType = kebabCase(args.elementType || "block");

    return {
        name: `pb-editor-page-element-${elementType}`,
        type: "pb-editor-page-element",
        elementType: elementType,
        settings:
            typeof args.settings === "function" ? args.settings(elementSettings) : elementSettings,
        create(options = {}) {
            const defaultValue: Partial<PbEditorElement> = {
                type: this.elementType,
                elements: [],
                data: {
                    // TODO: enable the user to provide default styles.
                    // It'd be better if no default styles were applied, or even better:
                    // if the default styles could be set via maybe the `Theme` object.
                    // We could also use the page element's factory function to provide defaults:
                    // `createBlock({ defaultStyles: { desktop: { ... }, tablet: { ... } } })`
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

            return typeof args.create === "function" ? args.create(defaultValue) : defaultValue;
        },
        render(props) {
            return <Block {...props} />;
        },
        // This callback is executed when another element is dropped on the drop zones with type "block"
        onReceived({ source, target, position, state, meta }) {
            const element = createDroppedElement(source as any, target);

            const block = addElementToParent(element, target, position);

            const result = executeAction<UpdateElementActionArgsType>(
                state,
                meta,
                updateElementAction,
                {
                    element: block,
                    history: true
                }
            );

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
                    source: source as PbEditorElement
                })
            );
            return result;
        }
    };
};
