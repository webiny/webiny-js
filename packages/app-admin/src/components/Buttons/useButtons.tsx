import React from "react";
import { ButtonDefault, ButtonPrimary, ButtonSecondary } from "./Buttons";

export interface ButtonsProviderContext {
    ButtonDefault: typeof ButtonDefault;
    ButtonPrimary: typeof ButtonPrimary;
    ButtonSecondary: typeof ButtonSecondary;
}

const ButtonsContext = React.createContext<ButtonsProviderContext | undefined>(undefined);

interface ButtonsProviderProps {
    children: React.ReactNode;
}

export const ButtonsProvider = ({ children }: ButtonsProviderProps) => {
    return (
        <ButtonsContext.Provider value={{ ButtonDefault, ButtonPrimary, ButtonSecondary }}>
            {children}
        </ButtonsContext.Provider>
    );
};

export const useButtons = (): ButtonsProviderContext => {
    const context = React.useContext(ButtonsContext);

    if (!context) {
        throw new Error("useButtons must be used within a ButtonsContext");
    }

    return context;
};
