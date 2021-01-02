import React from "react";
import { PbElement } from "../../../../types";
import RenderElement from "../../../components/Element";

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
