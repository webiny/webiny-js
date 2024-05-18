import { useContext } from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { ContentEntryContext } from "../ContentEntry/ContentEntryContext";

export const useContentEntry = makeDecoratable(() => {
    const context = useContext(ContentEntryContext);
    if (!context) {
        throw Error(
            `useContentEntry() hook can only be used within the ContentEntryContext provider.`
        );
    }
    return context;
});
