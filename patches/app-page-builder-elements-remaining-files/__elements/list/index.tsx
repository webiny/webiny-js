import React from "react";
import { Element } from "~/types";
import Text from "~/components/Text";

type TextPropsType = {
    element: Element;
};
const List: React.FunctionComponent<TextPropsType> = ({ element }) => {
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
