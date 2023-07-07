import React from "react";
import { CoreOptions } from "medium-editor";

import PeText from "./Text/PeText";


interface TextElementProps {
    elementId: string;
    mediumEditorOptions?: CoreOptions;
    rootClassName?: string;
    tag?: string | [string, Record<string, any>];
}

const Text: React.FC<TextElementProps> = props => {
    return <PeText {...props} />;
};

export default React.memo(Text);
