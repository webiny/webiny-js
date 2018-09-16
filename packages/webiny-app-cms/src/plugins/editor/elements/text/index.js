import React from "react";
import loremIpsum from "lorem-ipsum";
import Text, { className } from "./Text";
import { createValue } from "webiny-app-cms/editor/components/Slate";
import { ReactComponent as TextIcon } from "webiny-app-cms/editor/assets/icons/round-text_format-24px.svg";

const defaultLipsum = {
    count: 3,
    units: "sentences",
    sentenceLowerBound: 5,
    sentenceUpperBound: 15
};

export default [
    {
        name: "text",
        type: "cms-element",
        element: {
            title: "Text",
            group: "Text",
            groupIcon: <TextIcon />,
            settings: [
                "element-settings-background",
                "",
                "element-settings-border",
                "element-settings-shadow",
                "",
                "element-settings-padding",
                "element-settings-margin",
                "",
                "element-settings-clone",
                "element-settings-delete",
                "",
                "element-settings-advanced"
            ]
        },
        target: ["column", "row", "list-item"],
        create({ content = {}, ...options }) {
            const previewText = content.text || loremIpsum(content.lipsum || defaultLipsum);

            return {
                type: "text",
                elements: [],
                data: { text: createValue(previewText, content.typography || "paragraph") },
                settings: {
                  style: {
                      padding: "20px"
                  }
                },
                ...options
            };
        },
        render(props) {
            return <Text {...props} />;
        },
        preview() {
            const previewText = loremIpsum(defaultLipsum);

            return <p className={className}>{previewText}</p>;
        }
    }
];
