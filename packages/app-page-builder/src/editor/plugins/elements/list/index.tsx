import React from "react";
import loremIpsum from "lorem-ipsum";
import { DisplayMode, PbEditorPageElementPlugin } from "../../../../types";
import List, { className } from "./List";
import { createInitialTextValue } from "../utils/textUtils";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";

export default (): PbEditorPageElementPlugin => {
    const defaultLipsum = {
        count: 1,
        units: "sentences",
        sentenceLowerBound: 4,
        sentenceUpperBound: 4
    };

    return {
        name: "pb-editor-page-element-list",
        type: "pb-editor-page-element",
        elementType: "list",
        toolbar: {
            title: "List",
            group: "pb-editor-element-group-basic",
            preview() {
                return (
                    <div className={className}>
                        <ul>
                            <li>{loremIpsum(defaultLipsum)}</li>
                            <li>{loremIpsum(defaultLipsum)}</li>
                            <li>{loremIpsum(defaultLipsum)}</li>
                        </ul>
                    </div>
                );
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
            const previewText =
                content.text ||
                `<ul>
                    <li>Point 1</li>
                    <li>Point 2</li>
                    <li>Point 3</li>
                </ul>`;

            return {
                type: "list",
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
            return <List elementId={element.id} />;
        }
    };
};
