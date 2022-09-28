import { useContext } from "react";
import { FoldersContext } from "~/contexts";

export const useFolders = () => {
    return useContext(FoldersContext);
};
