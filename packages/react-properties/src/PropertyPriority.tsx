import React, { createContext, useContext } from "react";

const PropertyPriorityContext = createContext(0);

interface PropertyPriorityProviderProps {
    priority: number;
    children: React.ReactNode;
}

export const PropertyPriorityProvider = ({ priority, children }: PropertyPriorityProviderProps) => {
    return (
        <PropertyPriorityContext.Provider value={priority}>
            {children}
        </PropertyPriorityContext.Provider>
    );
};

export function usePropertyPriority(): number {
    return useContext(PropertyPriorityContext);
}
