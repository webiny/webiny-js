import { useContext } from "react";
import { CmsContext } from "@webiny/app-headless-cms/admin/contexts/Cms";

const useCms = () => {
    const context = useContext<any>(CmsContext);
    if (!context) {
        throw new Error("useCms must be used within a CmsProvider");
    }

    return context;
};

export default useCms;
