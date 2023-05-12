import { useContext } from "react";
import { AdminPageBuilderContext } from "../contexts/AdminPageBuilder";

export function useAdminPageBuilder() {
    const context = useContext(AdminPageBuilderContext);

    if (!context) {
        throw Error(
            `AdminPageBuilder context was not found! Are you using the "useAdminPageBuilder()" hook in the right place?`
        );
    }

    return context;
}
