import { useContext } from "react";
import { Context } from "../ContentEntry/ContentEntryContext";

export function useContentEntry() {
    return useContext(Context);
}
