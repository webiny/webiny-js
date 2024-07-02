import { useContext } from "react";
import { ContentEntriesContext } from "../ContentEntriesContext";

export function useContentEntries() {
    const context = useContext(ContentEntriesContext);
    if (!context) {
        throw Error(`Missing "ContentEntriesContext" provider in the component tree!`);
    }

    return context;
}
