import React from "react";
import { PbEditorElement } from "~/types";
import PbDocument from "./PbDocument";
import PeDocument from "./PeDocument";
import { isLegacyRenderingEngine } from "~/utils";
import { Element } from "@webiny/app-page-builder-elements/types";

interface DocumentProps {
    element: PbEditorElement;
}

const Document: React.FC<DocumentProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbDocument {...props} />;
    }

    const { element, ...rest } = props;
    return <PeDocument element={element as Element} {...rest} />;
};

export default Document;
