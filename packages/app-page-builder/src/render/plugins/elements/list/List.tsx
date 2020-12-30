import React from "react";
import { css } from "emotion";
import { PbElement } from "../../../../types";
import Text from "../../../components/Text";

const rootClassName = css({
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

type TextPropsType = {
    element: PbElement;
};
const List: React.FunctionComponent<TextPropsType> = ({ element }) => {
    return <Text element={element} rootClassName={rootClassName} />;
};

export default List;
