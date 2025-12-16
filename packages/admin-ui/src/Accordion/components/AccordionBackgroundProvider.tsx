import React, { createContext, useContext, ReactNode } from "react";
import { AccordionProps } from "~/Accordion/index.js";

type BackgroundValue = AccordionProps["background"];

const AccordionBackgroundContext = createContext<BackgroundValue>(undefined);

interface AccordionBackgroundProviderProps {
    children: ReactNode;
    currentBackground: BackgroundValue;
}

export const AccordionBackgroundProvider = ({
    children,
    currentBackground
}: AccordionBackgroundProviderProps) => {
    return (
        <AccordionBackgroundContext.Provider value={currentBackground}>
            {children}
        </AccordionBackgroundContext.Provider>
    );
};

export const useAccordionBackground = (fallbackBackground: BackgroundValue): BackgroundValue => {
    const currentBackground = useContext(AccordionBackgroundContext);
    if (!currentBackground) {
        return fallbackBackground;
    }

    // At the moment, we only alternate between "base" and "light" backgrounds for nested accordions.
    return currentBackground === "base" ? "light" : "base";
};
