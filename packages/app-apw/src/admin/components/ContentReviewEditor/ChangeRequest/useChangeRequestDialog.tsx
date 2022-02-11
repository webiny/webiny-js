import React, { useState, useContext, createContext } from "react";

const ChangeRequestDialogContext = createContext<ChangeRequestDialogContextValue>(null);

export interface ChangeRequestDialogContextValue {
    open: boolean;
    setOpen: (isOpen: boolean) => void;
    changeRequestId: string;
    setChangeRequestId: (id: string) => void;
}

export const useChangeRequestDialog = (): ChangeRequestDialogContextValue => {
    return useContext(ChangeRequestDialogContext);
};

export const ChangeRequestDialogProvider = ({ children }) => {
    const [open, setOpen] = useState<boolean>(false);
    const [changeRequestId, setChangeRequestId] = useState<string>(null);

    return (
        <ChangeRequestDialogContext.Provider
            value={{ open, setOpen, changeRequestId, setChangeRequestId }}
        >
            {children}
        </ChangeRequestDialogContext.Provider>
    );
};
