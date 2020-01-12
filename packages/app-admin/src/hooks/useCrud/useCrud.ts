import { useContext } from "react";
import { CrudContext, CrudContextValue } from "@webiny/app-admin/contexts/Crud";

export function useCrud() {
    const context = useContext(CrudContext) as CrudContextValue;
    if (!context) {
        throw new Error("useCrudList hook must be used within the CrudProvider.");
    }

    return context;
}
