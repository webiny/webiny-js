import { useContext } from "react";

import { Dialogs, DialogsContext } from "~/dialogs/dialogs";

export const useDialogsContext = (): DialogsContext => {
    const context = useContext(Dialogs);

    if (!context) {
        throw new Error("useDialogsContext must be used within a DialogsContext.Provider");
    }

    return context;
};
