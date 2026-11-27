import React from "react";
import { EditorConfig } from "~/BaseEditor/index.js";

// TODO: find a good place for this!
export const COLORS = {
    lightGray: "hsla(0, 0%, 97%, 1)",
    gray: "hsla(300, 2%, 92%, 1)",
    darkGray: "hsla(0, 0%, 70%, 1)",
    darkestGray: "hsla(0, 0%, 20%, 1)",
    black: "hsla(208, 100%, 5%, 1)"
};

export const ElementActions = () => {
    return (
        <div
            className={"flex flex-wrap justify-center border-y-1 border-solid"}
            style={{ borderColor: COLORS.gray, backgroundColor: COLORS.lightGray }}
        >
            <EditorConfig.ElementActions />
        </div>
    );
};
