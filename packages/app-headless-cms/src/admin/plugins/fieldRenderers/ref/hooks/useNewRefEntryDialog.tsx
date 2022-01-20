import React, { createContext, useContext, useState } from "react";

export interface NewRefEntryDialogContextValue {
    open: boolean;
    setOpen: Function;
}

export const NewRefEntryDialogContext = createContext<NewRefEntryDialogContextValue>(null);

export const NewRefEntryDialogContextProvider = ({ children }) => {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <NewRefEntryDialogContext.Provider
            value={{
                open,
                setOpen
            }}
        >
            {children}
        </NewRefEntryDialogContext.Provider>
    );
};

export const useNewRefEntryDialog = (): NewRefEntryDialogContextValue => {
    const { open, setOpen } = useContext(NewRefEntryDialogContext);
    return {
        open,
        setOpen
    };
};
