//@flow
import React from "react";
import RenderElement from "@webiny/app-page-builder/render/components/Element";
import type { PbElementType } from "@webiny/app-page-builder/types";

const Document = ({ element }: { element: PbElementType }) => {
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
