import React from "react";
import { toJS } from "mobx";

import { makeDecoratable, createVoidComponent } from "@webiny/react-composition";

import { Icon } from "./types";

export const IconRenderer = makeDecoratable("IconPickerIcon", createVoidComponent());

interface IconContext<T extends Icon = Icon> {
    icon: T;
    size: number;
}

const IconContext = React.createContext<IconContext | undefined>(undefined);

interface IconProviderProps {
    icon: Icon;
    size?: number;
    children: React.ReactNode;
}

export const IconProvider = ({ icon, size = 32, children }: IconProviderProps) => {
    // I want to use the POJO via the context, to reduce the need of using `observer` HOC everywhere.
    return (
        <IconContext.Provider value={{ icon: toJS(icon), size }}>{children}</IconContext.Provider>
    );
};

export function useIcon<T extends Icon = Icon>(): IconContext<T> {
    const context = React.useContext(IconContext);
    if (!context) {
        throw Error(`Missing <IconProvider> in the component tree!`);
    }
    return context as IconContext<T>;
}
