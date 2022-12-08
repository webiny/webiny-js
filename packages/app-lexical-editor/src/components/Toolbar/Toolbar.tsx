import { makeComposable } from "@webiny/react-composition";
import React from "react";
import { ToolbarType } from "~/types";

interface ToolbarProps {
    type: ToolbarType;
}

export const Toolbar = makeComposable<ToolbarProps>("Toolbar", ({ children }) => {
    return <>{children}</>;
});
