import { useContext } from "react";
import { FoldersApiContext } from "./FoldersApiProvider";

export function useFoldersApi() {
    const context = useContext(FoldersApiContext);
    if (!context) {
        throw new Error(`Missing "FoldersApiProvider" in the component hierarchy!`);
    }

    return context;
}
