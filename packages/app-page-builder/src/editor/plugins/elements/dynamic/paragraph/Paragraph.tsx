import React from "react";
import Text from "./Text";

export const textClassName = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

type ParagraphType = {
    elementId: string;
};
const Paragraph: React.FunctionComponent<ParagraphType> = ({ elementId }) => {
    return <Text elementId={elementId} editorOptions={[]} />;
};
export default React.memo(Paragraph);
