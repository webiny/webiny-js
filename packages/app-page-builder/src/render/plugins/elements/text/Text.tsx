import React from "react";
import Slate from "@webiny/app-page-builder/render/components/Slate";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement } from "@webiny/app-page-builder/types";

const Text = ({ element }: { element: PbElement }) => {
    return (
        <ElementRoot element={element} className={className}>
            <Slate value={element.data.text} />
        </ElementRoot>
    );
};

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

export default Text;
