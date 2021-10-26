import React from "react";
import Element from "~/editor/components/Element";
import { PbEditorPageElementRenderParams } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-document": any;
        }
    }
}

const pbDocumentStyles = {
    /**
     * By default, custom HTML tags like `pb-document` will have "display: inline",
     * whereas previous implementation uses HTML `div` element which have "display: block".
     * So, we're setting it explicitly here.
     */
    display: "block",
    /*
     * Styles migrated from ".webiny-pb-page-document" selector.
     */
    backgroundColor: "var(--webiny-theme-color-surface, #fff)",
    maxWidth: "100%",
    // fixes the overflow created by the animation library (fix pending)
    // https://github.com/michalsnik/aos/issues/416
    overflow: " hidden",
    width: "100vw",
    minHeight: "calc(100vh - 230px)",

    fontFamily: "var(--webiny-theme-typography-secondary-font-family, 'Lato, sans-serif')",
    fontSize: "calc(22 / 16 * 100%)",
    // Make everything look a little nicer in webkit
    WebkitFontSmoothing: "antialiased"
};

const PeDocument = ({ element }: PbEditorPageElementRenderParams) => {
    const { getClassNames } = usePageElements();

    return (
        <pb-document
            class={getClassNames(pbDocumentStyles)}
            data-testid={"pb-editor-page-canvas-section"}
        >
            {element.elements.map(id => {
                return <Element key={id} id={id} />;
            })}
        </pb-document>
    );
};

export default React.memo(PeDocument);
