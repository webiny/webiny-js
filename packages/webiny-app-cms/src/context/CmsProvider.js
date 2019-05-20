import React from "react";
import { CmsContextProvider } from "./CmsContext";

export default function CmsProvider({ children, ...props }) {
    return <CmsContextProvider {...props}>{children}</CmsContextProvider>;
}
