import React from "react";
import { PbElement } from "../../../../types";
import Text from "../../../components/Text";

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

interface TextPropsType {
    element: PbElement;
}
const Paragraph: React.VFC<TextPropsType> = ({ element }) => {
    return <Text element={element} />;
};

export default Paragraph;
