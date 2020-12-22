import React from "react";
import loremIpsum from "lorem-ipsum";
import { PbEditorPageElementPlugin } from "../../../../types";
import Heading, { headingClassName } from "./Heading";
import { createInitialEditorValue } from "../utils/textUtils";

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
                type: "heading",
                elements: [],
                data: {
                    text: createInitialEditorValue(previewText, content.typography || "h2"),
                    settings: {
                        margin: {
                            mobile: { top: "0px", left: "0px", right: "0px", bottom: "15px" },
                            desktop: { top: "0px", left: "0px", right: "0px", bottom: "25px" },
                            advanced: true
                        },
                        padding: {
                            desktop: { all: "0px" },
                            mobile: { all: "0px" }
                        },
                        horizontalAlign: "center"
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
