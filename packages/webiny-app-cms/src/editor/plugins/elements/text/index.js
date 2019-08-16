// @flow
import React from "react";
import loremIpsum from "lorem-ipsum";
import Text, { className } from "./Text";
import { createValue } from "webiny-app-cms/editor/components/Slate";
import type { ElementPluginType } from "webiny-app-cms/types";

export default (): ElementPluginType => {
    const defaultLipsum = {
        count: 3,
        units: "sentences",
        sentenceLowerBound: 5,
        sentenceUpperBound: 15
    };

    return {
        name: "pb-page-element-text",
        type: "pb-page-element",
        elementType: "text",
        toolbar: {
            title: "Text",
            group: "pb-page-element-group-basic",
            preview() {
                const previewText = loremIpsum(defaultLipsum);

                return <p className={className}>{previewText}</p>;
            }
        },
        settings: [
            "pb-page-element-settings-background",
            "",
            "pb-page-element-settings-border",
            "pb-page-element-settings-shadow",
            "",
            "pb-page-element-settings-padding",
            "pb-page-element-settings-margin",
            "",
            "pb-page-element-settings-clone",
            "pb-page-element-settings-delete",
            ""
        ],
        target: ["pb-page-element-column", "pb-page-element-row", "pb-page-element-list-item"],
        create({ content = {}, ...options }: Object) {
            const previewText = content.text || loremIpsum(content.lipsum || defaultLipsum);

            return {
                type: "pb-page-element-text",
                elements: [],
                data: {
                    text: createValue(previewText, content.typography || "paragraph"),
                    settings: {
                        margin: {
                            mobile: { top: 0, left: 0, right: 0, bottom: 15 },
                            desktop: { top: 0, left: 0, right: 0, bottom: 25 },
                            advanced: true
                        },
                        padding: {
                            desktop: { all: 0 },
                            mobile: { all: 0 }
                        }
                    }
                },
                ...options
            };
        },
        render({ element }: Object) {
            return <Text elementId={element.id} />;
        }
    };
};
