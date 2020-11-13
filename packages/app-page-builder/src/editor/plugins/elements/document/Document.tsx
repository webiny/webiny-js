import React from "react";
import Element from "@webiny/app-page-builder/editor/components/Element";
import { PbShallowElement } from "@webiny/app-page-builder/types";

type DocumentProps = { element: PbShallowElement };

const Document = ({ element }: DocumentProps) => {
    return (
        <div className={"webiny-pb-page-document"} data-testid={"pb-editor-page-canvas-section"}>
            {element.elements.map(id => {
                return <Element key={id} id={id} />;
            })}
        </div>
    );
};

export default React.memo(Document);
