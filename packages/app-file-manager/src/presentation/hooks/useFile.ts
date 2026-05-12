import React from "react";
import { FileContext } from "~/presentation/contexts/FileProvider.js";

export const useFile = () => {
    const context = React.useContext(FileContext);
    if (!context) {
        throw Error(
            `FileContext is missing in the component tree. Are you using "useFile()" hook in the right place?`
        );
    }

    return context;
};
