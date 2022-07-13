import { useContext } from "react";
import { Context } from "../ContentEntry/ContentEntryContext";

export function useContentEntry() {
    const context = useContext(Context);
    if (!context) {
        throw Error(
            `useContentEntry() hook can only be used within the ContentEntryContext provider.`
        );
    }
    return context;
}
