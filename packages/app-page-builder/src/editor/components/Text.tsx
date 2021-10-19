import React from "react";
import { CoreOptions } from "medium-editor";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";

import PeText from "./Text/PeText";
import PbText from "./Text/PbText";

type TextElementProps = {
    elementId: string;
    mediumEditorOptions: CoreOptions;
    rootClassName?: string;
    tag?: string | [string, Record<string, any>];
};

const Text: React.FunctionComponent<TextElementProps> = props => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PeText {...props} />;
    }
    return <PbText {...props} />;
};

export default React.memo(Text);
