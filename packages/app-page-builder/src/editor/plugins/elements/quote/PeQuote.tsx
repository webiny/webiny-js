import React, { useMemo } from "react";
import Text from "../../../components/Text";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import { getMediumEditorOptions } from "../utils/textUtils";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import {
    QuoteComponent,
    QuoteComponentProps
} from "@webiny/app-page-builder-elements/renderers/quote";

const DEFAULT_EDITOR_OPTIONS = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor", "quote"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

interface PeQuoteProps {
    isActive?: boolean;
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const PeQuote: React.FC<PeQuoteProps> = props => {
    const { element, isActive, mediumEditorOptions } = props;
    const { renderers } = usePageElements();

    const Quote = renderers.quote as QuoteComponent;

    const EditorComponent = useMemo<QuoteComponentProps["as"]>(() => {
        return function EditorComponent({ className }) {
            return (
                <Text
                    tag={["pb-quote", { class: className }]}
                    elementId={element.id}
                    mediumEditorOptions={getMediumEditorOptions(
                        DEFAULT_EDITOR_OPTIONS,
                        mediumEditorOptions
                    )}
                />
            );
        };
    }, []);

    if (isActive) {
        return <Quote element={element} as={EditorComponent} />;
    }

    return <Quote element={element} />;
};

export default PeQuote;
