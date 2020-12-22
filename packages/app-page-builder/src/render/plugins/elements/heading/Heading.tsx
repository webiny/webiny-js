import React from "react";
import { PbElement } from "../../../../types";
import Text from "../../../components/Text";

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

type TextPropsType = {
    element: PbElement;
};
const Heading: React.FunctionComponent<TextPropsType> = ({ element }) => {
    return <Text element={element} />;
};

export default Heading;
