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
        name: "cms-element-text",
        type: "cms-element",
        toolbar: {
            title: "Text",
            group: "cms-element-group-basic",
            preview() {
                const previewText = loremIpsum(defaultLipsum);

                return <p className={className}>{previewText}</p>;
            }
        },
        settings: [
            "cms-element-settings-background",
            "",
            "cms-element-settings-border",
            "cms-element-settings-shadow",
            "",
            "cms-element-settings-padding",
            "cms-element-settings-margin",
            "",
            "cms-element-settings-clone",
            "cms-element-settings-delete",
            ""
        ],
        target: ["cms-element-column", "cms-element-row", "cms-element-list-item"],
        create({ content = {}, ...options }: Object) {
            const previewText = content.text || loremIpsum(content.lipsum || defaultLipsum);

            return {
                type: "cms-element-text",
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
