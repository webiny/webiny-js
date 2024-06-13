import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { ContentEntryFormContext } from "./ContentEntryFormProvider";

export const useContentEntryForm = makeDecoratable(() => {
    const context = React.useContext(ContentEntryFormContext);
    if (!context) {
        throw new Error("ContentEntryFormProvider is missing in the component hierarchy!");
    }

    return context;
});
