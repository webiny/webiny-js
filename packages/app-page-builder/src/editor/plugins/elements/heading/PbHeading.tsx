import React from "react";
import classNames from "classnames";
import { CoreOptions } from "medium-editor";
import Text from "~/editor/components/Text";
import { PbEditorTextElementProps } from "~/types";
import { getMediumEditorOptions } from "../utils/textUtils";

export const headingClassName = classNames(
    "webiny-pb-base-page-element-style webiny-pb-page-element-text"
);

const DEFAULT_EDITOR_OPTIONS: CoreOptions = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

const PbHeading: React.VFC<PbEditorTextElementProps> = ({ elementId, mediumEditorOptions }) => {
    return (
        <Text
            elementId={elementId}
            mediumEditorOptions={getMediumEditorOptions(
                DEFAULT_EDITOR_OPTIONS,
                mediumEditorOptions
            )}
            rootClassName={headingClassName}
        />
    );
};

export default React.memo(PbHeading);
