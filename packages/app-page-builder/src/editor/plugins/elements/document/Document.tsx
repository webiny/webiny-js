import React from "react";
import { PbEditorElement } from "~/types";
import PbDocument from "./PbDocument";

interface DocumentProps {
    element: PbEditorElement;
}

const Document: React.FC<DocumentProps> = props => {
    return <PbDocument {...props} />;
};

export default Document;
