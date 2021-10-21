import React from "react";
import { PbEditorTextElementProps } from "~/types";
import Text from "~/editor/components/Text";
import { getMediumEditorOptions } from "../utils/textUtils";
import { DEFAULT_EDITOR_OPTIONS,className } from "./List";

const PbList: React.FunctionComponent<PbEditorTextElementProps> = ({
    elementId,
    mediumEditorOptions
}) => {
    return (
        <Text
            elementId={elementId}
            mediumEditorOptions={getMediumEditorOptions(
                DEFAULT_EDITOR_OPTIONS,
                mediumEditorOptions
            )}
            rootClassName={className}
        />
    );
};
export default React.memo(PbList);
