import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import Text from "../../../components/Text";

const editorClass = css({
    "&": {
        ol: {
            listStyle: "revert"
        },
        ul: {
            listStyle: "disc"
        },
        li: {
            marginLeft: "1.5em"
        }
    }
});

export const className = classNames(
    "webiny-pb-base-page-element-style webiny-pb-page-element-text",
    editorClass
);

const DEFAULT_EDITOR_OPTIONS = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor", "unorderedlist", "orderedlist"]
    }
};

type ParagraphType = {
    elementId: string;
};
const List: React.FunctionComponent<ParagraphType> = ({ elementId }) => {
    return (
        <Text
            elementId={elementId}
            editorOptions={DEFAULT_EDITOR_OPTIONS}
            rootClassName={className}
        />
    );
};
export default React.memo(List);
