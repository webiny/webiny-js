import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import Text from "../../../components/Text";

const headingPreviewStyle = css({
    h1: {
        fontSize: "3rem",
        lineHeight: 1
    },
    h2: {
        fontSize: "2.25rem",
        lineHeight: "2.5rem"
    },
    h3: {
        fontSize: "1.875rem",
        lineHeight: "2.25rem"
    },
    h4: {
        fontSize: "1.5rem",
        lineHeight: "2rem"
    },
    h5: {
        fontSize: "1.25rem",
        lineHeight: "1.75rem"
    },
    h6: {
        fontSize: "1.125rem",
        lineHeight: "1.75rem"
    }
});

export const headingClassName = classNames(
    "webiny-pb-base-page-element-style webiny-pb-page-element-text",
    headingPreviewStyle
);

const DEFAULT_EDITOR_OPTIONS = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor"]
    }
};

type TextType = {
    elementId: string;
};
const Heading: React.FunctionComponent<TextType> = ({ elementId }) => {
    return (
        <Text
            elementId={elementId}
            editorOptions={DEFAULT_EDITOR_OPTIONS}
            rootClassName={headingClassName}
        />
    );
};
export default React.memo(Heading);
