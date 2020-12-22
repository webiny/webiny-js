import React from "react";
import Quote, { className } from "./Quote";
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
    return {
        name: "pb-editor-page-element-quote",
        type: "pb-editor-page-element",
        elementType: "quote",
        toolbar: {
            title: "Quote",
            group: "pb-editor-element-group-basic",
            preview() {
                return (
                    <div className={className}>
                        <blockquote>
                            <q>We Live In A Twilight World. There Are No Friends At Dusk.</q>
                        </blockquote>
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
            const previewText =
                content.text || "We Live In A Twilight World. There Are No Friends At Dusk.";

            return {
                type: "quote",
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
            return <Quote elementId={element.id} />;
        }
    };
};
