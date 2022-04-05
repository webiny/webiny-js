import React from "react";
import classNames from "classnames";
import { PbEditorTextElementProps } from "~/types";

export const className = classNames(
    "webiny-pb-base-page-element-style webiny-pb-page-element-text"
);

const IFrame: React.FC<PbEditorTextElementProps> = () => {
    return (
        <span>Hello</span>
    );
};
export default React.memo(IFrame);
