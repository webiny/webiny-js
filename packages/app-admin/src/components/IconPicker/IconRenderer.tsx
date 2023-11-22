import React from "react";
import { makeComposable } from "@webiny/react-composition";
import { Icon } from "./types";

export const IconRenderer = makeComposable("IconPickerIcon");

interface IconContext<T extends Icon = Icon> {
    icon: T;
}

const IconContext = React.createContext<IconContext | undefined>(undefined);

interface IconProviderProps {
    icon: Icon;
    children: React.ReactNode;
}

export const IconProvider = ({ icon, children }: IconProviderProps) => {
    return <IconContext.Provider value={{ icon }}>{children}</IconContext.Provider>;
};

export function useIcon<T extends Icon = Icon>(): IconContext<T> {
    const context = React.useContext(IconContext);
    if (!context) {
        throw Error(`Missing <IconProvider> in the component tree!`);
    }
    return context as IconContext<T>;
}
