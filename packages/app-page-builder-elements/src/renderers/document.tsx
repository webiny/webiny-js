import React from "react";
import { Elements } from "~/components/Elements";
import { ElementRenderer } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-document": any;
        }
    }
}

const Document: ElementRenderer = ({ element }) => {
    return (
        <pb-document>
            <Elements element={element} />
        </pb-document>
    );
};

export const createDocument = () => Document;
