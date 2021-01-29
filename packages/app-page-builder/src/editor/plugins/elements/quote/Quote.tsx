import React from "react";
import classNames from "classnames";
import Text from "../../../components/Text";

export const className = classNames(
    "webiny-pb-base-page-element-style webiny-pb-page-element-text"
);

const DEFAULT_EDITOR_OPTIONS = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor", "quote"]
    }
};

type ParagraphType = {
    elementId: string;
};
const Quote: React.FunctionComponent<ParagraphType> = ({ elementId }) => {
    return (
        <Text
            elementId={elementId}
            editorOptions={DEFAULT_EDITOR_OPTIONS}
            rootClassName={className}
        />
    );
};
export default React.memo(Quote);
