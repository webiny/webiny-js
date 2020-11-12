import React from "react";
declare global {
    namespace JSX {
        interface IntrinsicElements {
            "li-title": {
                children?: React.ReactNode;
            };
            "li-content": {
                children?: React.ReactNode;
            };
        }
    }
}
export default function FileDetails(props: any): JSX.Element;
