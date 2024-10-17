import React from "react";
import kebabCase from "lodash/kebabCase";
import { Block } from "./Block";
import {
    DisplayMode,
    PbEditorPageElementPlugin,
    PbEditorElement,
    PbEditorElementPluginArgs
} from "~/types";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";

export default (args: PbEditorElementPluginArgs = {}): PbEditorPageElementPlugin => {
    const elementSettings = [
        "pb-editor-page-element-style-settings-background",
        "pb-editor-page-element-style-settings-animation",
        "pb-editor-page-element-style-settings-border",
        "pb-editor-page-element-style-settings-shadow",
        "pb-editor-page-element-style-settings-padding",
        "pb-editor-page-element-style-settings-margin",
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
        canReceiveChildren: true
    };
};
