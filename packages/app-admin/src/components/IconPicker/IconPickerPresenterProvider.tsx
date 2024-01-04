import React from "react";

import { IconPickerPresenterInterface } from "./IconPickerPresenter";

interface IconPickerPresenterProviderProps {
    presenter: IconPickerPresenterInterface;
    children: React.ReactNode;
}

const IconPickerPresenterContext = React.createContext<IconPickerPresenterInterface | undefined>(
    undefined
);

export const IconPickerPresenterProvider = ({
    presenter,
    children
}: IconPickerPresenterProviderProps) => {
    return (
        <IconPickerPresenterContext.Provider value={presenter}>
            {children}
        </IconPickerPresenterContext.Provider>
    );
};

export function useIconPicker() {
    const context = React.useContext(IconPickerPresenterContext);
    if (!context) {
        throw Error(`Missing <IconPickerPresenterProvider> in the component tree!`);
    }
    return context;
}
