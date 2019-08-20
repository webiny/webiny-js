import React from "react";
import { PageBuilderContextProvider } from "./PageBuilderContext";

export default function PageBuilderProvider({ children, ...props }) {
    return <PageBuilderContextProvider {...props}>{children}</PageBuilderContextProvider>;
}
