import React from "react";
import { Processor } from "@webiny/i18n/types";
declare global {
    namespace JSX {
        interface IntrinsicElements {
            "i18n-text": {
                children?: React.ReactNode;
            };
            "i18n-text-part": {
                key?: any;
                children?: React.ReactNode;
            };
        }
    }
}
declare const _default: Processor;
export default _default;
