import React from "react";
import { PbElement } from "../../../../types";
import Text from "../../../components/Text";

interface TextPropsType {
    element: PbElement;
}
const List: React.VFC<TextPropsType> = ({ element }) => {
    return (
        <Text
            element={element}
            rootClassName={
                "webiny-pb-base-page-element-style webiny-pb-page-element-text webiny-pb-typography-list"
            }
        />
    );
};

export default List;
