import React, { useEffect } from "react";
import { CmsContextProvider } from "./CmsContext";
import WebFont from "webfontloader";

export default function CmsProvider({ children, ...props }) {
    useEffect(() => {
        if (typeof window !== "undefined") {
            WebFont.load(props.theme.fonts);
        }
    }, []);
    return <CmsContextProvider {...props}>{children}</CmsContextProvider>;
}
