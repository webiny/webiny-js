import React from "react";
import { Elements } from "~/components/Elements";
import { ElementComponent } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-document": any;
        }
    }
}

const Document: ElementComponent = ({ element }) => {
    return (
        <pb-document>
            <Elements element={element} />
        </pb-document>
    );
};

export const createDocument = () => Document;
