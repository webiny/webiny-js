// @flow
import React from "react";
import Slate from "webiny-app-cms/render/components/Slate";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";
import type { ElementType } from "webiny-app-cms/types";

const Text = ({ element }: { element: ElementType }) => {
    return (
        <ElementRoot element={element} className={className}>
            <Slate value={element.data.text} />
        </ElementRoot>
    );
};

export const className = "webiny-cms-base-element-style webiny-cms-element-text";

export default Text;
