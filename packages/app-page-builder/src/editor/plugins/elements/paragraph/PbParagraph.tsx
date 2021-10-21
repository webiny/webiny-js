import React from "react";
import { PbEditorTextElementProps } from "~/types";
import Text from "~/editor/components/Text";
import { getMediumEditorOptions } from "../utils/textUtils";
import { DEFAULT_EDITOR_OPTIONS } from "./Paragraph";

const PbParagraph: React.FunctionComponent<PbEditorTextElementProps> = props => {
    const { elementId, mediumEditorOptions } = props;

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
