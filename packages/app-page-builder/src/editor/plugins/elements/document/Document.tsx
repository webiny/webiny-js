import React from "react";
import { PbEditorPageElementRenderParams } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import PeDocument from "./PeDocument";
import PbDocument from "./PbDocument";

const Document = (props: PbEditorPageElementRenderParams) => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PeDocument {...props} />;
    }
    return <PbDocument {...props} />;
};

export default React.memo(Document);
