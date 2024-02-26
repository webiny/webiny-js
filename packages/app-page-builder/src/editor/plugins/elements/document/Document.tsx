import React from "react";
import { PbEditorElement } from "~/types";
import PeDocument from "./PeDocument";

import { Element } from "@webiny/app-page-builder-elements/types";

interface DocumentProps {
    element: PbEditorElement;
}

const Document = (props: DocumentProps) => {
    const { element, ...rest } = props;
    return <PeDocument element={element as Element} {...rest} />;
};

export default Document;
