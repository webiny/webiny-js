import { useContext, Context } from "react";
import { AcoListContext, AcoListContextData } from "~/contexts/acoList";
import { GenericSearchData } from "~/types";

export const useAcoList = <T extends GenericSearchData>() => {
    const context = useContext<AcoListContextData<T>>(
        AcoListContext as unknown as Context<AcoListContextData<T>>
    );
    if (!context) {
        throw new Error("useAcoList must be used within a AcoListContext");
    }

    return context;
};
