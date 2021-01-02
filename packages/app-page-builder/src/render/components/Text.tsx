import React from "react";
import classNames from "classnames";
import { PbElement } from "../../types";
import { ElementRoot } from "./ElementRoot";

type TextPropsType = {
    element: PbElement;
    rootClassName?: string;
};
const TextElement: React.FunctionComponent<TextPropsType> = ({ element, rootClassName }) => {
    const { data, typography, tag = "div" } = element.data.text;

    return (
        <ElementRoot element={element} className={classNames(className, rootClassName, typography)}>
            {React.createElement(tag, {
                dangerouslySetInnerHTML: { __html: data.text }
            })}
        </ElementRoot>
    );
};

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

export default React.memo(TextElement);
