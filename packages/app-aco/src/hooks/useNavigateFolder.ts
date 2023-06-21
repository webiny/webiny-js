import { useContext } from "react";
import { NavigateFolderContext } from "~/contexts/navigateFolder";

export const useNavigateFolder = () => {
    const context = useContext(NavigateFolderContext);
    if (!context) {
        throw new Error("useNavigateFolder must be used within a NavigateFolderContext");
    }

    return context;
};
