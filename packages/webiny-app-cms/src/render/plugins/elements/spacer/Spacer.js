//@flow
import React from "react";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";
import type { ElementType } from "webiny-app-cms/types";

const Spacer = ({ element }: { element: ElementType }) => {
    return <ElementRoot element={element} />;
};

export default Spacer;
