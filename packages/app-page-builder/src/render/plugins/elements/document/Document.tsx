import React from "react";
import RenderElement from "@webiny/app-page-builder/render/components/Element";
import { PbElement } from "@webiny/app-page-builder/types";

const Document = ({ element }: { element: PbElement }) => {
    if (!element || Array.isArray(element)) {
        return null;
    }
    return (
        <div className={"webiny-pb-page-document"}>
            {element.elements.map(element => (
                <RenderElement key={element.id} element={element} />
            ))}
        </div>
    );
};

export default Document;
