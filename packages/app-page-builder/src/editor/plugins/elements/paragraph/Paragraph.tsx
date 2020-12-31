import React from "react";
import Text from "../../../components/Text";

export const textClassName = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

const DEFAULT_EDITOR_OPTIONS = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor"]
    }
};

type ParagraphType = {
    elementId: string;
};
const Paragraph: React.FunctionComponent<ParagraphType> = ({ elementId }) => {
    return <Text elementId={elementId} editorOptions={DEFAULT_EDITOR_OPTIONS} />;
};
export default React.memo(Paragraph);
