import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import Text from "../../../components/Text";

const editorClass = css({
    "&": {
        blockquote: {
            quotes: `"“" "”"`,
            "&::before": {
                content: "open-quote"
            },
            "&::after": {
                content: "close-quote"
            }
        }
    }
});

export const className = classNames(
    "webiny-pb-base-page-element-style webiny-pb-page-element-text",
    editorClass
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
            rootClassName={editorClass}
        />
    );
};
export default React.memo(Quote);
