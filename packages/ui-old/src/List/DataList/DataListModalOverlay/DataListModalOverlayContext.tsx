import React from "react";

interface DataListModalOverlayProviderContext {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
}
export const DataListModalOverlayContext = React.createContext<DataListModalOverlayProviderContext>(
    {
        isOpen: false,
        setIsOpen: () => {
            return void 0;
        }
    }
);

export interface DataListModalOverlayProviderProps {
    children?: React.ReactChild | React.ReactChild[];
}

export const DataListModalOverlayProvider = ({ children }: DataListModalOverlayProviderProps) => {
    const [isOpen, setIsOpen] = React.useState<boolean>(false);

    return (
        <DataListModalOverlayContext.Provider value={{ isOpen, setIsOpen }}>
            {children}
        </DataListModalOverlayContext.Provider>
    );
};
