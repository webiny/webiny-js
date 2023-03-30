import React, { createContext, useContext, useState } from "react";

export interface NewRefEntryDialogContextValue {
    open: boolean;
    setOpen: (value: boolean) => void;
}

export const NewRefEntryDialogContext = createContext<NewRefEntryDialogContextValue>({
    open: false,
    setOpen: () => {
        return void 0;
    }
});

interface NewRefEntryDialogContextProviderProps {
    children: React.ReactNode;
}

export const NewRefEntryDialogContextProvider: React.VFC<NewRefEntryDialogContextProviderProps> = ({
    children
}) => {
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
