import React from "react";
import Element from "../../../components/Element";
import invariant from "invariant";
import { PbEditorElement } from "~/types";

interface DocumentProps {
    element: PbEditorElement;
}

const Document: React.FC<DocumentProps> = ({ element }) => {
    return (
        <div className={"webiny-pb-page-document"} data-testid={"pb-editor-page-canvas-section"}>
            {element.elements.map((target, index) => {
                const id = typeof target === "string" ? target : target.id;
                invariant(
                    id,
                    `Could not determine id of child #${index} in element with id "${element.id}".`
                );
                return <Element key={id} id={id} />;
            })}
        </div>
    );
};

export default React.memo(Document);
