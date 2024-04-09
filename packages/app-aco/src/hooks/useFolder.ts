import React from "react";
import { FolderContext } from "~/contexts/folder";

export const useFolder = () => {
    const context = React.useContext(FolderContext);
    if (!context) {
        throw Error(
            `FolderContext is missing in the component tree. Are you using "useFolder()" hook in the right place?`
        );
    }

    return context;
};
