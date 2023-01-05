import React from "react";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import PeQuote from "./PeQuote";
import PbQuote from "./PbQuote";
import { isLegacyRenderingEngine } from "~/utils";
import { Element } from "@webiny/app-page-builder-elements/types";

interface QuoteProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const Quote: React.FC<QuoteProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbQuote {...props} elementId={props.element.id} />;
    }

    const { element, ...rest } = props;
    return <PeQuote element={props.element as Element} {...rest} />;
};

export default React.memo(Quote);
