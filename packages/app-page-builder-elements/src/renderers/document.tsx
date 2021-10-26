import React from "react";
import { Elements } from "~/components/Elements";
import { ElementRenderer } from "~/types";
import { usePageElements } from "~/hooks/usePageElements";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-document": any;
        }
    }
}

const defaultStyles = {
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

const Document: ElementRenderer = ({ element }) => {
    const { getClassNames } = usePageElements();
    return (
        <pb-document class={getClassNames(defaultStyles)}>
            <Elements element={element} />
        </pb-document>
    );
};

export const createDocument = () => Document;
