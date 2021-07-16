import { useContext } from "react";
import { Context } from "../ContentEntriesContext";

export function useContentEntries() {
    return useContext(Context);
}
