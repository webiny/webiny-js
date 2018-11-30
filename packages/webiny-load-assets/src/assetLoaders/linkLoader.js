// @flow

/* global document */

import { type AssetLoaderType } from "webiny-load-assets/types";

export default ({
    canProcess: processedArgument => processedArgument.type === "link",
    mustProcess: processedArgument => {
        const { src } = processedArgument;
        return document.querySelectorAll(`link[rel="stylesheet"][href="${src}"]`).length === 0;
    },
    process: processedArgument => {
        const { src } = processedArgument;

        return new Promise(resolve => {
            const s = document.createElement("link");
            s.rel = "stylesheet";
            s.href = src;
            s.onload = resolve;
            document.head && document.head.appendChild(s);
        });
    }
}: AssetLoaderType);
