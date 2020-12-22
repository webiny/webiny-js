import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import Text from "../../../components/Text";

const headingPreviewStyle = css({
    fontWeight: 600
});

export const headingClassName = classNames(
    "webiny-pb-base-page-element-style webiny-pb-page-element-text",
    headingPreviewStyle
);

const DEFAULT_EDITOR_OPTIONS = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor", "h1", "h2", "h3", "h4", "h5", "h6"]
    }
};

type TextType = {
    elementId: string;
};
const Heading: React.FunctionComponent<TextType> = ({ elementId }) => {
    return <Text elementId={elementId} editorOptions={DEFAULT_EDITOR_OPTIONS} />;
};
export default React.memo(Heading);
