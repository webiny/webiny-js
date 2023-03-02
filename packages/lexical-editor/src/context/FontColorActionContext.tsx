import React from "react";

export interface FontColorActionContext {
    value: string;
    onChange: (value: string) => void;
}

export const FontColorActionContext = React.createContext<FontColorActionContext | undefined>(
    undefined
);
