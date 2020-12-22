import React from "react";
import loremIpsum from "lorem-ipsum";
import { PbEditorPageElementPlugin } from "../../../../types";
import Text, { textClassName } from "./Paragraph";
import { createInitialEditorValue } from "../utils/textUtils";

export default (): PbEditorPageElementPlugin => {
    const defaultLipsum = {
        count: 3,
        units: "sentences",
        sentenceLowerBound: 5,
        sentenceUpperBound: 15
    };

    return {
        name: "pb-editor-page-element-paragraph",
        type: "pb-editor-page-element",
        elementType: "paragraph",
        toolbar: {
            title: "Paragraph",
            group: "pb-editor-element-group-basic",
            preview() {
                const previewText = loremIpsum(defaultLipsum);

                return <p className={textClassName}>{previewText}</p>;
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
                type: "paragraph",
                elements: [],
                data: {
                    text: createInitialEditorValue(previewText, content.typography || "paragraph"),
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
            return <Text elementId={element.id} />;
        }
    };
};
