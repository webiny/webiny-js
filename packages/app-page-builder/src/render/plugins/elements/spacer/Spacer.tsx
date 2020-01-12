import React from "react";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement } from "@webiny/app-page-builder/types";

const Spacer = ({ element }: { element: PbElement }) => {
    return <ElementRoot element={element} />;
};

export default Spacer;
