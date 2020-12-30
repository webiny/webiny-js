import React from "react";
import { css } from "emotion";
import { PbElement } from "../../../../types";
import Text from "../../../components/Text";

const rootClassName = css({
    "&": {
        blockquote: {
            quotes: `"“" "”"`,
            "&::before": {
                content: "open-quote"
            },
            "&::after": {
                content: "close-quote"
            }
        }
    }
});

type TextPropsType = {
    element: PbElement;
};
const Quote: React.FunctionComponent<TextPropsType> = ({ element }) => {
    return <Text element={element} rootClassName={rootClassName} />;
};

export default Quote;
