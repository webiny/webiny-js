import React from "react";
import Text from "~/editor/components/Text";
import { CoreOptions } from "medium-editor";
import { PbEditorTextElementProps } from "~/types";
import { getMediumEditorOptions } from "../utils/textUtils";

const DEFAULT_EDITOR_OPTIONS: CoreOptions = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

const PbParagraph: React.FC<PbEditorTextElementProps> = ({ elementId, mediumEditorOptions }) => {
    return (
        <Text
            elementId={elementId}
            mediumEditorOptions={getMediumEditorOptions(
                DEFAULT_EDITOR_OPTIONS,
                mediumEditorOptions
            )}
        />
    );
};
export default React.memo(PbParagraph);
