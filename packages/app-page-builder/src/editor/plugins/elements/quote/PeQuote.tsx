import React, { useMemo } from "react";
import Text from "../../../components/Text";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import { getMediumEditorOptions } from "../utils/textUtils";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { QuoteRenderer } from "@webiny/app-page-builder-elements/renderers/quote";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useRenderer } from "@webiny/app-page-builder-elements";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";

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
    const variableValue = useElementVariableValue(element);

    const Quote = renderers.quote as QuoteRenderer;

    const EditorComponent = useMemo<React.VFC>(() => {
        return function EditorComponent() {
            const { getElement, getAttributes } = useRenderer();
            const attributes = getAttributes();
            const element = getElement();

            return (
                <Text
                    tag={["div", attributes]}
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
        return <Quote element={element as Element} as={EditorComponent} value={variableValue} />;
    }

    return <Quote element={element as Element} value={variableValue} />;
};

export default PeQuote;
