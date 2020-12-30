import React from "react";
import loremIpsum from "lorem-ipsum";
import { DisplayMode, PbEditorPageElementPlugin } from "../../../../types";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";
import Heading, { headingClassName } from "./Heading";
import { createInitialTextValue } from "../utils/textUtils";

export default (): PbEditorPageElementPlugin => {
    const defaultLipsum = {
        count: 3,
        units: "sentences",
        sentenceLowerBound: 5,
        sentenceUpperBound: 15
    };

    return {
        name: "pb-editor-page-element-heading",
        type: "pb-editor-page-element",
        elementType: "heading",
        toolbar: {
            title: "Heading",
            group: "pb-editor-element-group-basic",
            preview() {
                const previewText =
                    "The Easiest Way To Adopt  Serverless" || loremIpsum(defaultLipsum);

                return <h2 className={headingClassName}>{previewText}</h2>;
            }
        },
        settings: [
            [
                "pb-editor-page-element-style-settings-text",
                { useCustomTag: true, tags: ["h1", "h2", "h3", "h4", "h5", "h6"] }
            ],
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
            const previewText = content.text || loremIpsum(content.lipsum || defaultLipsum);

            return {
                type: "heading",
                elements: [],
                data: {
                    text: {
                        ...createInitialPerDeviceSettingValue(
                            createInitialTextValue({
                                type: this.elementType,
                                tag: "h1"
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
                        ),
                        horizontalAlign: createInitialPerDeviceSettingValue(
                            "center",
                            DisplayMode.DESKTOP
                        )
                    }
                },
                ...options
            };
        },
        render({ element }) {
            return <Heading elementId={element.id} />;
        }
    };
};
