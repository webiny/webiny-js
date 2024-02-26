import React, { useState, useContext, createContext } from "react";

const ChangeRequestDialogContext = createContext<ChangeRequestDialogContextValue>(
    {} as ChangeRequestDialogContextValue
);

export interface ChangeRequestDialogContextValue {
    open: boolean;
    setOpen: (isOpen: boolean) => void;
    changeRequestId: string | null;
    setChangeRequestId: (id: string) => void;
}

export const useChangeRequestDialog = (): ChangeRequestDialogContextValue => {
    return useContext(ChangeRequestDialogContext);
};

interface ChangeRequestDialogProviderProps {
    children: React.ReactNode;
}

export const ChangeRequestDialogProvider = ({ children }: ChangeRequestDialogProviderProps) => {
    const [open, setOpen] = useState<boolean>(false);
    const [changeRequestId, setChangeRequestId] = useState<string | null>(null);

    return (
        <ChangeRequestDialogContext.Provider
            value={{ open, setOpen, changeRequestId, setChangeRequestId }}
        >
            {children}
        </ChangeRequestDialogContext.Provider>
    );
};
