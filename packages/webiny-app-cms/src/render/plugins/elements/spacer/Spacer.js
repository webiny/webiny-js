//@flow
import React from "react";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";
import type { ElementType } from "webiny-app-cms/types";

const Spacer = ({ element }: ElementType) => {
    return <ElementStyle {...getElementStyleProps(element)} />;
};

export default Spacer;
