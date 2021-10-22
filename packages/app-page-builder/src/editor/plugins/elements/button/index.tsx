import React from "react";
import { css } from "emotion";
import kebabCase from "lodash/kebabCase";
import {
    DisplayMode,
    PbEditorPageElementPlugin,
    PbEditorPageElementStyleSettingsPlugin,
    PbEditorElementPluginArgs
} from "~/types";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";
import ButtonSettings from "./ButtonSettings";
import Button from "./Button";

const buttonWrapper = css({
    display: "flex",
    justifyContent: "center"
});

const buttonElementPluginsFactory = (args: PbEditorElementPluginArgs = {}) => {
    const defaultSettings = [
        "pb-editor-page-element-style-settings-button",
        "pb-editor-page-element-style-settings-link",
        "pb-editor-page-element-style-settings-horizontal-align-flex",
        "pb-editor-page-element-style-settings-margin",
        "pb-editor-page-element-settings-clone",
        "pb-editor-page-element-settings-delete"
    ];

    const defaultToolbar = {
        title: "Button",
        group: "pb-editor-element-group-basic",
        preview() {
            return (
                <div className={buttonWrapper}>
                    <button className={"webiny-pb-page-element-button"}>Click me</button>
                </div>
            );
        }
    };

    const elementType = kebabCase(args.elementType || "button");

    return [
        {
            name: `pb-editor-page-element-${elementType}`,
            type: "pb-editor-page-element",
            elementType: elementType,
            toolbar:
                typeof args.toolbar === "function" ? args.toolbar(defaultToolbar) : defaultToolbar,
            settings:
                typeof args.settings === "function"
                    ? args.settings(defaultSettings)
                    : defaultSettings,
            target: ["cell", "block"],
            create(options) {
                const defaultValue = {
                    type: this.elementType,
                    elements: [],
                    data: {
                        buttonText: "Click me",
                        settings: {
                            margin: createInitialPerDeviceSettingValue(
                                { all: "0px" },
                                DisplayMode.DESKTOP
                            ),
                            horizontalAlignFlex: createInitialPerDeviceSettingValue(
                                "center",
                                DisplayMode.DESKTOP
                            )
                        }
                    },
                    ...options
                };

                return typeof args.create === "function" ? args.create(defaultValue) : defaultValue;
            },
            render(props) {
                return <Button {...props} />;
            }
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-style-settings-button",
            type: "pb-editor-page-element-style-settings",
            render() {
                return <ButtonSettings />;
            }
        } as PbEditorPageElementStyleSettingsPlugin
    ];
};

export default buttonElementPluginsFactory;
