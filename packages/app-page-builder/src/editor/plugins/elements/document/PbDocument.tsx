import React from "react";
import Element from "~/editor/components/Element";
import { PbEditorPageElementRenderParams } from "~/types";

const PbDocument = ({ element }: PbEditorPageElementRenderParams) => {
    return (
        <div className={"webiny-pb-page-document"} data-testid={"pb-editor-page-canvas-section"}>
            {element.elements.map(id => {
                return <Element key={id} id={id} />;
            })}
        </div>
    );
};

export default React.memo(PbDocument);
