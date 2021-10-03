import React from "react";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import Text from "~/editor/components/Text";
import { getMediumEditorOptions } from "../utils/textUtils";
import { CoreOptions } from "medium-editor";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-heading": any;
        }
    }
}

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

const CustomHeading = props => {
    const { element, mediumEditorOptions } = props;
    const tag = element.data.text.desktop.tag || "h1";

    const { getClassNames, getElementClassNames, getThemeClassNames, combineClassNames } =
        usePageElements();
    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element),
        getThemeClassNames(theme => theme.styles.typography.h),
        getThemeClassNames(theme => theme.styles.typography[tag])
    );

    return (
        <pb-heading class={classNames}>
            {props.isActive ? (
                <Text
                    elementId={element.id}
                    mediumEditorOptions={getMediumEditorOptions(
                        DEFAULT_EDITOR_OPTIONS,
                        mediumEditorOptions
                    )}
                />
            ) : (
                React.createElement(tag, {
                    dangerouslySetInnerHTML: { __html: element.data.text.data.text }
                })
            )}
        </pb-heading>
    );
};

export default CustomHeading;
