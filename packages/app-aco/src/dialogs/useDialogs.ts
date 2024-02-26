import { useContext } from "react";

import { Dialogs } from "~/dialogs/dialogs";

export const useDialogs = () => {
    const context = useContext(Dialogs);

    if (!context) {
        throw new Error("useDialogs must be used within a DialogsContext.Provider");
    }

    return context;
};
