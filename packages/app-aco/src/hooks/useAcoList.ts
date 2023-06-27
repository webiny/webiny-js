import { useContext } from "react";
import { AcoListContext } from "~/contexts/acoList";

export const useAcoList = () => {
    const context = useContext(AcoListContext);
    if (!context) {
        throw new Error("useAcoList must be used within a AcoListContext");
    }

    return context;
};
