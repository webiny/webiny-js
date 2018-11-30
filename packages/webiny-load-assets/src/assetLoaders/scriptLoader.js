// @flow

/* global document */

import { type AssetLoaderType } from "webiny-load-assets/types";

export default ({
    canProcess: processedArgument => processedArgument.type === "script",
    mustProcess: processedArgument => {
        const { src } = processedArgument;
        return document.querySelectorAll(`script[src="${src}"]`).length === 0;
    },
    process: processedArgument => {
        const { src } = processedArgument;

        return new Promise(resolve => {
            const s = document.createElement("script");
            s.type = "text/javascript";
            s.src = src;
            s.async = true;
            s.onload = resolve;
            document.body && document.body.appendChild(s);
        });
    }
}: AssetLoaderType);
