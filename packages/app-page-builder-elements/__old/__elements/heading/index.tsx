import React from "react";
import classNames from "classnames";
import { Element } from "~/types";
import Text from "~/components/Text";

export const headingClassName = classNames(
    "webiny-pb-base-page-element-style webiny-pb-page-element-text"
);

type TextPropsType = {
    element: Element;
};
const Heading: React.FunctionComponent<TextPropsType> = ({ element }) => {
    return <Text element={element} rootClassName={headingClassName} />;
};

export default Heading;
