import React from "react";

export const DataListModalOverlayContext = React.createContext(null);

export type DataListModalOverlayProviderProps = {
    children?: React.ReactChild | React.ReactChild[];
};

export const DataListModalOverlayProvider = ({ children }: DataListModalOverlayProviderProps) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <DataListModalOverlayContext.Provider value={{ isOpen, setIsOpen }}>
            {children}
        </DataListModalOverlayContext.Provider>
    );
};
