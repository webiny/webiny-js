import { useContext } from "react";
import { Context } from "../ContentEntriesContext";

export function useContentEntries() {
    const context = useContext(Context);
    if (!context) {
        throw Error(`Missing "ContentEntriesContext" provider in the component tree!`);
    }

    return context;
}
