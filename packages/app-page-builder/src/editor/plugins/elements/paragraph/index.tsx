import React from "react";
import { DisplayMode, PbEditorPageElementPlugin } from "../../../../types";
import Text, { textClassName } from "./Paragraph";
import { createInitialTextValue } from "../utils/textUtils";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";

export default (): PbEditorPageElementPlugin => {
    const defaultText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
     Suspendisse varius enim in eros elementum tristique.
     Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.
     Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere.`;

    return {
        name: "pb-editor-page-element-paragraph",
        type: "pb-editor-page-element",
        elementType: "paragraph",
        toolbar: {
            title: "Paragraph",
            group: "pb-editor-element-group-basic",
            preview() {
                return <p className={textClassName}>{defaultText}</p>;
            }
        },
        settings: [
            "pb-editor-page-element-style-settings-text",
            "pb-editor-page-element-style-settings-background",
            "pb-editor-page-element-style-settings-border",
            "pb-editor-page-element-style-settings-shadow",
            "pb-editor-page-element-style-settings-padding",
            "pb-editor-page-element-style-settings-margin",
            "pb-editor-page-element-settings-clone",
            "pb-editor-page-element-settings-delete"
        ],
        target: ["cell", "block"],
        create({ content = {}, ...options }) {
            const previewText = content.text || defaultText;

            return {
                type: "paragraph",
                elements: [],
                data: {
                    text: {
                        ...createInitialPerDeviceSettingValue(
                            createInitialTextValue({
                                type: this.elementType
                            }),
                            DisplayMode.DESKTOP
                        ),
                        data: {
                            text: previewText
                        }
                    },
                    settings: {
                        margin: createInitialPerDeviceSettingValue(
                            { all: "0px" },
                            DisplayMode.DESKTOP
                        ),
                        padding: createInitialPerDeviceSettingValue(
                            { all: "0px" },
                            DisplayMode.DESKTOP
                        )
                    }
                },
                ...options
            };
        },
        render({ element }) {
            return <Text elementId={element.id} />;
        }
    };
};
