import { useContext } from "react";

import { DialogsContext } from "./DialogsContext";

export const useDialogs = () => {
    const context = useContext(DialogsContext);

    if (!context) {
        throw new Error("useDialogs must be used within a DialogsContext.Provider");
    }

    return context;
};

export { useCustomDialog } from "./CustomDialog";
