import React from "react";
import classNames from "classnames";
import { PbElement } from "~/types";
import Text from "../../../components/Text";

export const headingClassName = classNames(
    "webiny-pb-base-page-element-style webiny-pb-page-element-text"
);

interface TextPropsType {
    element: PbElement;
}
const Heading: React.VFC<TextPropsType> = ({ element }) => {
    return <Text element={element} rootClassName={headingClassName} />;
};

export default Heading;
