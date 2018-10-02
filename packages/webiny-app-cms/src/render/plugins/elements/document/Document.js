//@flow
import React from "react";
import { connect } from "react-redux";
import RenderElement from "webiny-app-cms/render/components/Element";
import type { ElementType } from "webiny-app-cms/types";

const Document = ({ element }: { element: ElementType }) => {
    if(!element || Array.isArray(element)) {
        return null;
    }
    return element.elements.map(element => <RenderElement key={element.id} element={element} />);
};

export default Document;
