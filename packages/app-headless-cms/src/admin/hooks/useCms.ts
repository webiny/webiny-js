import { useContext } from "react";
import { CmsContext } from "../contexts/Cms";

function useCms() {
    const context = useContext(CmsContext);
    if (!context) {
        throw new Error("useCms must be used within a CmsProvider");
    }

    return context;
}

export default useCms;
