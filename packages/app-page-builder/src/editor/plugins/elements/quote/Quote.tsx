import React from "react";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import PeQuote from "./PeQuote";
import PbQuote from "./PbQuote";
import { isLegacyRenderingEngine } from "~/utils";

interface QuoteProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const Quote: React.FC<QuoteProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbQuote {...props} elementId={props.element.id} />;
    }
    return <PeQuote {...props} />;
};

export default React.memo(Quote);
