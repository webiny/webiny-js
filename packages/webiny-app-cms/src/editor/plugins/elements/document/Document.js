//@flow
import React from "react";
import Element from "webiny-app-cms/editor/components/Element";
import type { ElementType } from "webiny-app-cms/types";

const Document = ({ element }: { element: ElementType }) => {
    return element.elements.map(element => <Element key={element.id} element={element} />);
};

export default Document;
