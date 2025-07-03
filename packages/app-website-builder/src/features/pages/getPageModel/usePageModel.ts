import React from "react";
import { PageModelContext } from "./PageModelContext.js";

export function usePageModel() {
    const context = React.useContext(PageModelContext);
    if (!context) {
        throw Error(`Missing "PageModelContext" in the component tree!`);
    }

    return context;
}
