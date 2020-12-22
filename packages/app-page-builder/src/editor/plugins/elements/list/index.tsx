import React from "react";
import loremIpsum from "lorem-ipsum";
import List, { className } from "./List";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";

const createInitialEditorValue = (text: string, type: string) => {
    return {
        type,
        data: {
            text
        }
    };
};

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
            "pb-editor-page-element-style-settings-background",
            "pb-editor-page-element-style-settings-border",
            "pb-editor-page-element-style-settings-shadow",
            "pb-editor-page-element-style-settings-text",
            "pb-editor-page-element-style-settings-horizontal-align",
            "pb-editor-page-element-style-settings-padding",
            "pb-editor-page-element-style-settings-margin",
            "pb-editor-page-element-settings-clone",
            "pb-editor-page-element-settings-delete"
        ],
        target: ["cell", "block"],
        create({ content = {}, ...options }) {
            const previewText = content.text || loremIpsum(content.lipsum || defaultLipsum);

            return {
                type: "list",
                elements: [],
                data: {
                    text: createInitialEditorValue(
                        previewText,
                        content.typography || "description"
                    ),
                    settings: {
                        margin: {
                            mobile: { top: "0px", left: "0px", right: "0px", bottom: "15px" },
                            desktop: { top: "0px", left: "0px", right: "0px", bottom: "25px" },
                            advanced: true
                        },
                        padding: {
                            desktop: { all: "0px" },
                            mobile: { all: "0px" }
                        }
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
