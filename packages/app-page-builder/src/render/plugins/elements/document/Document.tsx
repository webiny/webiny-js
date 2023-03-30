import React from "react";
import { PbElement } from "~/types";
import RenderElement from "../../../components/Element";

interface DocumentProps {
    element: PbElement;
}
const Document: React.VFC<DocumentProps> = ({ element }) => {
    if (!element || Array.isArray(element)) {
        return null;
    }

    return (
        <div className={"webiny-pb-page-document"}>
            {(element.elements as PbElement[]).map(element => (
                <RenderElement key={element.id} element={element} />
            ))}
        </div>
    );
};

export default Document;
