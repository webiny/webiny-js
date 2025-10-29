import React, { createContext, useContext, ReactNode } from "react";
import { type CardProps } from "../Card.js";

type CardContextValue = Omit<CardProps, "children">;

const CardContext = createContext<CardContextValue | undefined>(undefined);

interface CardProviderProps extends CardContextValue {
    children: ReactNode;
}

export const CardProvider = ({ children, ...props }: CardProviderProps) => {
    return <CardContext.Provider value={props}>{children}</CardContext.Provider>;
};

export const useCardProps = (): CardContextValue => {
    const context = useContext(CardContext);
    if (!context) {
        throw new Error("useCardProps must be used within CardProvider");
    }
    return context;
};
