//@flow
import React from "react";
import { pure } from "recompose";
import Element from "webiny-app-cms/editor/components/Element";
import type { ElementType } from "webiny-app-cms/types";

const Document = pure(({ element }: { element: ElementType }) => {
    return element.elements.map(el => <Element key={el} id={el} />);
});

export default Document;
