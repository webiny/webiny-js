import React from "react";
import { PbEditorPageElementRenderParams } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";

import PbBlock from "./PbBlock";
import PeBlock from "./PeBlock";

const Block: React.FC<PbEditorPageElementRenderParams> = props => {
    const pageElements = usePageElements();

    if (pageElements) {
        return <PeBlock {...props} />;
    }
    return <PbBlock {...props} />;
};

export default React.memo(Block);
