//@flow
import React from "react";
import RenderElement from "webiny-app-cms/render/components/Element";
import type { ElementType } from "webiny-app-cms/types";

const Document = ({ element }: { element: ElementType }) => {
    if (!element || Array.isArray(element)) {
        return null;
    }
    return (
        <div className={"webiny-cms-page-document"}>
            {element.elements.map(element => (
                <RenderElement key={element.id} element={element} />
            ))}
        </div>
    );
};

export default Document;
