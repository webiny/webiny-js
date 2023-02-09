import { useContext } from "react";
import { PageBuilderContext } from "~/contexts/PageBuilder";

export function usePageBuilder() {
    const context = useContext(PageBuilderContext);

    if (!context) {
        throw Error(
            `PageBuilder context was not found! Are you using the "usePageBuilder()" hook in the right place?`
        );
    }

    return context;
}
