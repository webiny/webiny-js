import React from "react";
import {MediumEditorOptions, PbEditorElement} from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import PeQuote from "./PeQuote";
import PbQuote from "./PbQuote";

interface QuoteProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const Quote: React.FC<QuoteProps> = props => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PeQuote {...props} />;
    }
    return <PbQuote {...props} elementId={props.element.id} />;
};

export default React.memo(Quote);
