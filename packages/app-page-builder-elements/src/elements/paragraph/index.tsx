import React from "react";
import { PageElement } from "~/types";
import Text from "~/components/Text";

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

type TextPropsType = {
    element: PageElement;
};
const Paragraph: React.FunctionComponent<TextPropsType> = ({ element }) => {
    return <Text element={element} />;
};

export default Paragraph;
