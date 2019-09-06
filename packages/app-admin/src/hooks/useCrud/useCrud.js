// @flow
import { useContext } from "react";
import { CrudContext } from "@webiny/app-admin/contexts/CrudContext";

function useCrud() {
    const context = useContext(CrudContext);
    if (!context) {
        throw new Error("useCrudList hook must be used within the CrudProvider.");
    }

    return context;
}

export { useCrud };
