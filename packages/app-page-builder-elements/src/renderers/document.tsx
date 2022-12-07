import React from "react";
import { Elements } from "~/components/Elements";
import { Element, ElementRenderer, ElementRendererProps } from "~/types";
import page from "./page"
declare global {
    namespace JSX {
        interface IntrinsicElements {
            "pb-document": any;
        }
    }
}

export interface DocumentComponentProps extends ElementRendererProps {
    elements: Array<Element>;
}

export type DocumentComponent = ElementRenderer<DocumentComponentProps>;

const Document: DocumentComponent = ({ element, elements }) => {

    return (
        <pb-document   class={"webiny-pb-page-document"}>
            <Elements element={page} />
        </pb-document>
    );
};

export const createDocument = () => Document;
