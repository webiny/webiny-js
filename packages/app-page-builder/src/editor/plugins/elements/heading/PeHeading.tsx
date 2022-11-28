import React from "react";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import Text from "~/editor/components/Text";
import { getMediumEditorOptions } from "../utils/textUtils";
import { CoreOptions } from "medium-editor";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import styled from "@emotion/styled";

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

interface PeHeadingProps {
    isActive?: boolean;
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const PeHeading: React.FC<PeHeadingProps> = props => {
    const { element } = props;
    const { getStyles, getElementStyles } = usePageElements();
    const tag = element.data.text.desktop.tag || "h1";

    const styles = [...getStyles(defaultStyles), ...getElementStyles(element)];
    const Content = styled(({ className }) =>
        React.createElement(tag, {
            dangerouslySetInnerHTML: {
                __html: element.data.text.data.text
            },
            className
        })
    )(styles);

    return (
        <pb-heading data-pe-id={element.id}>
            <Content />
        </pb-heading>
    );

    // ----------

    //
    // const { element, mediumEditorOptions } = props;
    // const elementDataText = element.data.text || {};
    // const tag = elementDataText.desktop?.tag || "h1";
    //
    // const { getStyles, getElementStyles } = usePageElements();
    // // const classNames = combineClassNames(
    // //     getStyles(defaultStyles),
    // //     // TODO @ts-refactor figure out correct type
    // //     getElementStyles(element as any)
    // // );
    //
    // return (
    //     <pb-heading>
    //         {props.isActive ? (
    //             <Text
    //                 tag={[tag, { className: classNames }]}
    //                 elementId={element.id}
    //                 mediumEditorOptions={getMediumEditorOptions(
    //                     DEFAULT_EDITOR_OPTIONS,
    //                     mediumEditorOptions
    //                 )}
    //             />
    //         ) : (
    //             React.createElement(tag, {
    //                 dangerouslySetInnerHTML: { __html: elementDataText.data?.text },
    //                 className: classNames
    //             })
    //         )}
    //     </pb-heading>
    // );
};

export default PeHeading;
