//@flow
import React from "react";
import { ElementRoot } from "webiny-app-page-builder/render/components/ElementRoot";
import type { PbElementType } from "webiny-app-page-builder/types";

const Spacer = ({ element }: { element: PbElementType }) => {
    return <ElementRoot element={element} />;
};

export default Spacer;
