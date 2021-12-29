import React, { useState, useContext, createContext } from "react";

const ChangeRequestDialogContext = createContext<{ open: boolean; setOpen: Function }>(null);

export const useChangeRequestDialog = () => {
    const { open, setOpen } = useContext(ChangeRequestDialogContext);

    return {
        open,
        setOpen
    };
};

export const ChangeRequestDialogProvider = ({ children }) => {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <ChangeRequestDialogContext.Provider value={{ open, setOpen }}>
            {children}
        </ChangeRequestDialogContext.Provider>
    );
};
