import React, { createContext, useContext } from "react";
import { type CardProps } from "../Card.js";

type CardContextValue = CardProps;

const CardContext = createContext<CardContextValue | undefined>(undefined);

interface CardProviderProps extends CardContextValue {
    props: CardProps;
    children: React.ReactNode;
}

export const CardPropsProvider = ({ props, children }: CardProviderProps) => {
    return <CardContext.Provider value={props}>{children}</CardContext.Provider>;
};

export const useCardProps = (): CardContextValue => {
    const context = useContext(CardContext);
    if (!context) {
        throw new Error("useCardProps must be used within CardProvider");
    }
    return context;
};
