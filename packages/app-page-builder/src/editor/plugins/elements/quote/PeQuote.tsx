import React from "react";
import Text from "../../../components/Text";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import { getMediumEditorOptions } from "../utils/textUtils";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";

const DEFAULT_EDITOR_OPTIONS = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor", "quote"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

const defaultStyles = { display: "block" };

interface PeQuoteProps {
    isActive?: boolean;
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-quote": any;
        }
    }
}

const PeQuote: React.FC<PeQuoteProps> = props => {
    const { element, isActive, mediumEditorOptions } = props;
    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element as any)
    );

    if (isActive) {
        return (
            <Text
                tag={["pb-quote", { class: classNames }]}
                elementId={element.id}
                mediumEditorOptions={getMediumEditorOptions(
                    DEFAULT_EDITOR_OPTIONS,
                    mediumEditorOptions
                )}
            />
        );
    }

    const elementDataText = element.data.text || {};

    return (
        <pb-quote
            class={classNames}
            dangerouslySetInnerHTML={{ __html: elementDataText.data?.text }}
        ></pb-quote>
    );
};

export default React.memo(PeQuote);
