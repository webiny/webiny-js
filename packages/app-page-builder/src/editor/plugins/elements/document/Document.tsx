import React from "react";
import { PbEditorElement } from "~/types";
import PbDocument from "./PbDocument";
import PeDocument from "./PeDocument";
import { isLegacyRenderingEngine } from "~/utils";

interface DocumentProps {
    element: PbEditorElement;
}

const Document: React.FC<DocumentProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbDocument {...props} />;
    }

    return <PeDocument {...props}/>
};

export default Document;
