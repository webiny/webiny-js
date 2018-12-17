// @flow
import React from "react";
import Slate from "webiny-app-cms/render/components/Slate";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";
import type { ElementType } from "webiny-app-cms/types";

const Text = ({ element }: { element: ElementType }) => {
    return (
        <ElementStyle {...getElementStyleProps(element)} className={className}>
            <Slate value={element.data.text} />
        </ElementStyle>
    );
};

export const className = "webiny-cms-element-text";

export default Text;
