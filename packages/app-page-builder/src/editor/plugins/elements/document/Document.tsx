import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import PeDocument from "./PeDocument";
import PbDocument from "./PbDocument";

interface DocumentProps {
    element: PbEditorElement;
}

const Document: React.FC<DocumentProps> = props => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PeDocument {...props} />;
    }
    return <PbDocument {...props} />;
};

export default Document;
