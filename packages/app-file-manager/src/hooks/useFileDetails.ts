import React from "react";
import { FileDetailsContext } from "~/components/FileDetails/FileDetailsProvider";

export const useFileDetails = () => {
    const context = React.useContext(FileDetailsContext);
    if (!context) {
        throw Error(
            `FileDetailsContext is missing in the component tree. Are you using "useFileDetails()" hook in the right place?`
        );
    }

    return context;
};
