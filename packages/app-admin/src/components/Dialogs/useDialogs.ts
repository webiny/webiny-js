import { useContext } from "react";

import { DialogsContext } from "./DialogsContext.js";

export const useDialogs = () => {
    const context = useContext(DialogsContext);

    if (!context) {
        throw new Error("useDialogs must be used within a DialogsContext.Provider");
    }

    return context;
};
