import React from "react";
import classNames from "classnames";
import Text from "~/editor/components/Text";
import { PbEditorTextElementProps } from "~/types";
import { getMediumEditorOptions } from "../utils/textUtils";

export const className = classNames(
    "webiny-pb-base-page-element-style webiny-pb-page-element-text webiny-pb-typography-list"
);

const DEFAULT_EDITOR_OPTIONS = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor", "unorderedlist", "orderedlist"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

const PbList: React.FC<PbEditorTextElementProps> = ({ elementId, mediumEditorOptions }) => {
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
