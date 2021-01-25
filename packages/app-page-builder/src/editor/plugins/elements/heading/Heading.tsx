import React from "react";
import classNames from "classnames";
import Text from "../../../components/Text";

export const headingClassName = classNames(
    "webiny-pb-base-page-element-style webiny-pb-page-element-text"
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
