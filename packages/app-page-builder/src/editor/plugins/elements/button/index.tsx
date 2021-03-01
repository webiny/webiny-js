import React from "react";
import { css } from "emotion";
import {
    DisplayMode,
    PbEditorPageElementPlugin,
    PbEditorPageElementStyleSettingsPlugin
} from "../../../../types";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";
import ButtonSettings from "./ButtonSettings";
import Button from "./Button";

const buttonWrapper = css({
    display: "flex",
    justifyContent: "center"
});

export default () => {
    return [
        {
            name: "pb-editor-page-element-button",
            type: "pb-editor-page-element",
            elementType: "button",
            toolbar: {
                title: "Button",
                group: "pb-editor-element-group-basic",
                preview() {
                    return (
                        <div className={buttonWrapper}>
                            <button className={"webiny-pb-page-element-button"}>Click me</button>
                        </div>
                    );
                }
            },
            settings: [
                "pb-editor-page-element-style-settings-button",
                "pb-editor-page-element-style-settings-link",
                "pb-editor-page-element-style-settings-horizontal-align-flex",
                "pb-editor-page-element-style-settings-margin",
                "pb-editor-page-element-settings-clone",
                "pb-editor-page-element-settings-delete"
            ],
            target: ["cell", "block"],
            create(options) {
                return {
                    type: "button",
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
            },
            render({ element }) {
                return <Button element={element} />;
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
