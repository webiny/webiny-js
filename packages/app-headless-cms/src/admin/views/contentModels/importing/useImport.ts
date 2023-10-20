import React from "react";
import { ImportContext } from "./ImportContext";

export const useImport = () => {
    const context = React.useContext(ImportContext);
    if (!context) {
        throw new Error("useImport must be used within a ImportContext");
    }

    return context;
};
