import React from "react";
import Text from "~/editor/components/Text";
import { CoreOptions } from "medium-editor";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import { getMediumEditorOptions } from "../utils/textUtils";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import styled from "@emotion/styled";

const DEFAULT_EDITOR_OPTIONS: CoreOptions = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

const defaultStyles = { display: "block" };

interface PeParagraphProps {
    isActive?: boolean;
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-paragraph": any;
        }
    }
}

const PeParagraph: React.FC<PeParagraphProps> = props => {
    const { element, isActive, mediumEditorOptions } = props;
    const { getStyles, getElementStyles } = usePageElements();

    if (isActive) {
        return (
            <Text
                tag={["pb-paragraph", { class: 'classNames' }]}
                elementId={element.id}
                mediumEditorOptions={getMediumEditorOptions(
                    DEFAULT_EDITOR_OPTIONS,
                    mediumEditorOptions
                )}
            />
        );
    }

    const styles = [...getStyles(defaultStyles), ...getElementStyles(element)];
    const PbParagraph = styled(({ className }) => (
        <pb-paragraph
            class={className}
            dangerouslySetInnerHTML={{ __html: element.data.text?.data?.text }}
        />
    ))(styles);

    return <PbParagraph />;
    
};

export default React.memo(PeParagraph);
